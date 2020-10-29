// ---- Authentication middleware -----

var authMiddleware = new TykJS.TykMiddleware.NewMiddleware({});

//var jwt = require('jsonwebtoken');

var iss = "${TEMP_KEYCLOAK_SERVICE_PUBLIC_URL}/auth/realms/${KC_REALM}"
var aud = "${KC_CLIENT_ID}"

var full_authn_pk="-----BEGIN PUBLIC KEY-----\n${KC_PUBLIC_KEY}\n-----END PUBLIC KEY-----"



function getCookie(request, cookie_name) {
    if (!("Cookie" in request.Headers)) {
	return undefined;
    }
    var splitCookie = request.Headers["Cookie"][0].split("; ");
    var valueCookie = _.find(splitCookie, function(cookie) {
        if (cookie.indexOf(cookie_name+"=") > -1) {
            return cookie
        }
    });

    return valueCookie
}

function isTokenExpired(decodedPayload) {
    log("-- Checking token expiration --")
    tokenExpires = decodedPayload["exp"]
    sysTime = (new Date).getTime()/1000 | 0;

    return sysTime>tokenExpires
}
function isTokenValid(decodedHeader, decodedPayload, decodedSignature) {
    log("-- Verifying Token Validity --")

    // Verify token
    var isValid = false;
    try{
        log("Found alg as " + decodedHeader["alg"])
        //log("Found aud as " + decodedPayload["aud"])
        //log("Found iss as " + decodedPayload["iss"])

        isValid = decodedHeader["alg"] == "RS256" && decodedPayload["aud"] == aud && decodedPayload["iss"] == iss 
        
        // TODO: Verify against public key!
        //jwt.verify(token, full_authn_pk, { algorithms: ['RS256'] })
        //var concat = b64enc(JSON.stringify(decodedHeader)) + "." + b64enc(JSON.stringify(decodedPayload))
        //log("Concatted : " + concat)
        
    } catch(err) {
        log('Error verifying token! : ' + err);
        isValid = false;
    }

    if (isValid) {
        log('Token is valid!');
    } else {
        log('Token is invalid!');
    }

    return isValid;
}

authMiddleware.NewProcessRequest(function(request, session, spec) {
    log("Running Authorization JSVM middleware")

    log("Checking Authorization")
    if (request.Headers["Authorization"] === undefined) {
        try {
            log("Checking Cookie")
            var tokenCookie = getCookie(request, "session_id")
        } catch(err) {
            log(err)
            var tokenCookie = undefined
        }

        if (tokenCookie != undefined) {
            log("Manipulating Cookie")
            var idToken = tokenCookie.split("=")[1];

            tokenHeader = idToken.split(".")[0]
            headerPadding = tokenHeader.length % 4

            if (headerPadding != 0) {
                _.times(4-headerPadding, function() {
                    tokenHeader += "="
                })
            }

            tokenPayload = idToken.split(".")[1]
            payloadPadding = tokenPayload.length % 4
            
            if (payloadPadding != 0) {
                _.times(4-payloadPadding, function() {
                    tokenPayload += "="
                })
            }

            tokenSignature = idToken.split(".")[2]
            
        
            decodedHeader = JSON.parse(b64dec(tokenHeader))
            decodedPayload = JSON.parse(b64dec(tokenPayload))
        
            if (isTokenExpired(decodedPayload)) {
                request.ReturnOverrides.ResponseCode = 302;
                request.ReturnOverrides.ResponseHeaders = {
                    "Location": spec.config_data.TYK_SERVER + "/auth/login?app_url=" + request.URL
                };
                log(request.URL);

            } else if (isTokenValid(decodedHeader, decodedPayload, tokenSignature) == false) {
                log("--- Token invalid. Rejecting Call ---")
                request.ReturnOverrides.ResponseCode = 500;
                request.ReturnOverrides.ResponseError = "Invalid key! Check your token and try again."

            }  else {
                log(request.SetHeaders["Authorization"])   
                // more requests...             

                var vault_data = call_vault(request, session, spec, idToken);

                if(vault_data != undefined) {
                    // Response
                    request.SetHeaders["Authorization"] = "Bearer " + idToken;
                    request.SetHeaders['X-CanDIG-Authz'] = 'Bearer ' + vault_data.data.token;
                    
                }
            }

        } else {
            if (spec.config_data.SESSION_ENDPOINTS === undefined) {
                request.ReturnOverrides.ResponseCode = 302
                request.ReturnOverrides.ResponseHeaders = {
                    "Location": spec.config_data.TYK_SERVER + "/auth/login?app_url=" + request.URL
                }
            } else if (_.contains(spec.config_data.SESSION_ENDPOINTS, request.URL)) {
                request.ReturnOverrides.ResponseCode = 302
                request.ReturnOverrides.ResponseHeaders = {
                    "Location": spec.config_data.TYK_SERVER + "/auth/login?app_url=" + request.URL
                }
            } else {
                request.ReturnOverrides.ResponseCode = 403
                request.ReturnOverrides.ResponseError = "Valid access token required"
            } 
        }
    }
    
    return authMiddleware.ReturnData(request, session.meta_data);
});
    
log("Authorization middleware initialised");



// --- Vault ---


//var authMiddleware = new TykJS.TykMiddleware.NewMiddleware({});
//authMiddleware.NewProcessRequest(function(request, session, spec) {
function call_vault(request, session, spec, tykToken) {
    log("Running the authz middleware")
    //TODO : boolean variable to toggle dev logging
    log(tykToken)

    if (request.Headers["X-CanDIG-Authz"] === undefined) {

        var authorization_header = 'Bearer ' + tykToken;
        if (authorization_header == undefined) 
            throw new Error("Missing Authorization Header!");
        
        var splits = authorization_header.split(" ");
        log(splits[0])
        if (splits[0] != "Bearer")
            throw new Error("Missing Bearer token!");

        var token = splits[1];
        var tokenPayload = token.split(".")[1];
        var decodedPayload = JSON.parse(b64dec(tokenPayload));
        log("Decoded Payload: "+JSON.stringify(decodedPayload))
        
        
        var data = {
            "jwt": token,
            "role": spec.config_data.VAULT_ROLE
        };
        var requestParams = {
            "Method": "POST",
            "Domain": spec.config_data.VAULT_SERVICE_URL,
            "Resource": spec.config_data.VAULT_SERVICE_RESOURCE,
            "Body": JSON.stringify(data)
        };

        var resp = TykMakeHttpRequest(JSON.stringify(requestParams));
        var respJson = JSON.parse(resp);
        log("Vault Response: " + JSON.stringify(respJson))
        
        if (respJson.Code == 200) {
            // Yup we need two JSON.parse
            var vaultJson = JSON.parse(respJson.Body);
            var vaultToken = vaultJson.auth.client_token;
            
            var headers = {
                "X-Vault-Token": vaultToken
            };
            
            // We have validated the JWT and gotten an access token for Vault
            // we can now fetch the entitlements at /v1/secret/data/$userId
            // TODO: will have to decide on the path for these, inside vault
            // this path being user-created, we can do whatever
            var requestParams = {
                "Headers": headers,
                "Method": "GET",
                "Domain": spec.config_data.VAULT_SERVICE_URL,
                "Resource": "/v1/identity/oidc/token/" + spec.config_data.VAULT_ROLE,
            };

            var resp = TykMakeHttpRequest(JSON.stringify(requestParams));
            var respJson = JSON.parse(resp);
            log("Vault Response: " + JSON.stringify(respJson))

            if (respJson.Code == 200) {
                var vaultData = JSON.parse(respJson.Body);

                //request.SetHeaders['X-CanDIG-Authz'] = 'Bearer ' + vaultData.data.token;

                log("KC Token: " + request.SetHeaders['Authorization'])
                log("Vault Token: " + request.SetHeaders['X-CanDIG-Authz'])
                return vaultData;
            }
        }    
    }
    
    //return authMiddleware.ReturnData(request, session.meta_data);
};//);
    
log("New test authz middleware initialised");

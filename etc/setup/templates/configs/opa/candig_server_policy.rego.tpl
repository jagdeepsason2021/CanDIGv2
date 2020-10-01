package permissions

import input

now := time.now_ns()/1000000000

default allowed = false

default iss = "${TYK_PROVIDERS_ISSUER}"
default aud = "${KC_CLIENT_ID}"

default full_authn_pk=`-----BEGIN PUBLIC KEY-----
${KC_PUBLIC_KEY}
-----END PUBLIC KEY-----`

#default full_authz_pk=`-----BEGIN PUBLIC KEY-----
#${VAULT_PUBLIC_KEY}
#-----END PUBLIC KEY-----`

default authz_jwks=`${VAULT_JWKS}`

allowed = true {
    # retrieve authentication token parts
    [authN_token_header, authN_token_payload, authN_token_signature] := io.jwt.decode(input.kcToken)

    # retrieve authorization token parts
    [authZ_token_header, authZ_token_payload, authZ_token_signature] := io.jwt.decode(input.vaultToken)


    # Verify authentication token signature
    authN_token_is_valid := io.jwt.verify_rs256(input.kcToken, full_authn_pk)

    # Verify authentication token signature
    authZ_token_is_valid := io.jwt.verify_rs256(input.vaultToken, authz_jwks)


    all([
        # Authentication
        authN_token_is_valid == true, 
        authN_token_payload.aud == aud, 
        authN_token_payload.iss == iss, 
        authN_token_payload.iat < now,
        
        authN_token_payload.preferred_username == "bob",

        # Authorization
        authZ_token_is_valid == true,
        ##authZ_token_payload.aud == aud, 
        ##authZ_token_payload.iss == iss, 
        authZ_token_payload.iat < now,
    ])
}
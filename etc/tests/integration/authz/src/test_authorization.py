import os
import unittest
import time
import requests
import pytest
import json
import random


@pytest.mark.usefixtures("setup")
class TestAuthorization():
    
    def test_internal_server_error_500_candig_server_authorization_permission(self):
        body = { "input" : { "kcToken": "...", "vaultToken": "..." } }
        response = requests.request('POST', self.candig_server_authz_url, json=body)

        assert response.status_code == 500
    

    def test_cannot_get_candig_server_authorization_permission(self):
        body = { "input" : { "kcToken": "abc.123.123456", "vaultToken": "def.456.def456" } }
        response = requests.request('POST', self.candig_server_authz_url, json=body)

        assert response.status_code == 500
    

    def test_can_get_candig_server_authorization_permission(self):
        body = { 
            "input" : {
                "kcToken": "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJwLW9Wd3JreEZGM2ZrdG91TjFVcVhIWndtelVqVWVOX0NYcEpzcTFXQkw4In0.eyJleHAiOjE2MDI2MTU3OTMsImlhdCI6MTYwMjYxNTQ5MywiYXV0aF90aW1lIjoxNjAyNjE1NDkzLCJqdGkiOiIyZjVmMzRlZC1iZGYyLTRmMmQtOTYxMy05YWQ1NTg1ZDZkMjIiLCJpc3MiOiJodHRwOi8vY2FuZGlnYXV0aC5sb2NhbDo4MDgxL2F1dGgvcmVhbG1zL2NhbmRpZyIsImF1ZCI6ImNxX2NhbmRpZyIsInN1YiI6ImZmMWU4NzI2LTgyM2EtNDBhYi1hMmM3LWY3ODMyYjczMzhkOSIsInR5cCI6IklEIiwiYXpwIjoiY3FfY2FuZGlnIiwic2Vzc2lvbl9zdGF0ZSI6ImFkNDA2NmQ5LTQ4MWItNGQ0Mi04Y2UwLThmODA4YTJmZjJmOCIsImFjciI6IjEiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsInByZWZlcnJlZF91c2VybmFtZSI6ImJvYiJ9.QtsSQRfXxIsEXE0UfqWQV8fxg1wpTnfMI4tmg8aNVDUUCtcBIOj_IpRN0nJS7mwN3ykKJO9l9Wby2AZ6KGCYGjEUH1LMAojytVtAc91T8UgO3nb_0ar38aAP8rL5oF2uA7T6lkbWGGO6CB6CwlH-hsH5gb4mMV9MjYCZy7G1nKS3zoy2G7_TCMuiA1HhxJPmTfO-ze1Ir1pYz2nuE_Uey2s3_uhNeokdToTYZRayF_w6MpkGX5yeDxY01tzPt-8_fhAq1Cly5ExoftbDttI4MXcgNJUghxy1BcY1Z__Q914igyNmfdIUbhwQMi2H1rfPv2jZgquxYvogT00p38Deng",
                "vaultToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjllNmE5ZjZmLTg4NGMtNDg4MS1hNmZlLWE3NmZhMmUyNzhmNCJ9.eyJhdWQiOiJjcV9jYW5kaWciLCJleHAiOjE2MDI3MDE4OTQsImlhdCI6MTYwMjYxNTQ5NCwiaXNzIjoiL3YxL2lkZW50aXR5L29pZGMiLCJuYW1lc3BhY2UiOiJyb290IiwicGVybWlzc2lvbnMiOnsiZGF0YXNldDEyMyI6IjQifSwic3ViIjoiN2ZiNjBiMWYtODljMS0wNjdmLTEzMWYtOGY3YjY1NmY5Y2M5In0.FU_E09GOBKACgKaQKZjSX04wrGn5Gghk4kUbYPPJl01I2CZZPnMkUEn2693ACapUBfCCUJ2A1jEX7mlbedaHkC6yF473RryM22ej0yuUWprxXLliwTiyoHiHYkuaqA_DjnZK-wPyyGTTjCIRuRZF7rwR-haj4c4ahEWYJwCI6SRpuGPqy5r_qQusXDYAz4WlaeDMSmY--onddZihzBczYPM4vmrWRoRbV0LlKK4B2UWPBMRLOa2CVfAQLQObmItuVw90mRhRWhDtBVHew7cRkHXqg03tbjzcyaTwsAJdXoQ9XeEhdUDTaBNdk_xinvDl4rcEZTwRfT6lxFfAnuvAmQ"
             }
        }
        response = requests.request('POST', self.candig_server_authz_url, json=body)

        assert response.status_code == 200


    # def test_get_candig_server_authorization_does_defend_against_hs256_alg_token_tampering(self):
    #     # TODO: test HS256 attack against RS256
    #     body = { 
    #         "input" : {
    #             "kcToken": "",
    #             "vaultToken": ""
    #          }
    #     }
    #     response = requests.request('POST', self.candig_server_authz_url, json=body)

    #     assert response.status_code in [400, 500]


    # def test_get_candig_server_authorization_does_defend_against_none_alg_token_tampering(self):
    #     # TODO: test "none alg"
    #     body = { 
    #         "input" : {
    #             "kcToken": "",
    #             "vaultToken": ""
    #          }
    #     }
    #     response = requests.request('POST', self.candig_server_authz_url, json=body)

    #     assert response.status_code in [400, 500]


    def test_get_candig_server_authorization_does_defend_against_jibberish_bruteforce(self):

        start = time.time()         # the variable that holds the starting time
        elapsed = 0                 # the variable that holds the number of seconds elapsed.
        limit_sec=3

        while elapsed < limit_sec : # only run for the limited number of seconds

            # create jibberish
            j1hash1 = random.getrandbits(random.randint(256,512))
            j1hash2 = random.getrandbits(random.randint(256,512))
            j1hash3 = random.getrandbits(random.randint(256,512))
            j2hash1 = random.getrandbits(random.randint(256,512))
            j2hash2 = random.getrandbits(random.randint(256,512))
            j2hash3 = random.getrandbits(random.randint(256,512))

            jib1=("%032x" % j1hash1) + "." + ("%032x" % j1hash2) + "." + ("%032x" % j1hash3)
            jib2=("%032x" % j2hash1) + "." + ("%032x" % j2hash2) + "." + ("%032x" % j2hash3)

            # generates things like :
            # 1efda8374250e[...]6aaff58d9f1c4f2.7f1913e3c0ea281fe6[...]06c123cb6133efb121f9e.45b916cbd5eca17[...]504ef991f00266ddeff
            # to immitate a jwt format         #                                            #

            body = { 
                "input" : {
                    "kcToken": jib1,
                    "vaultToken": jib2
                }
            }
            response = requests.request('POST', self.candig_server_authz_url, json=body)

            assert response.status_code in [400, 500]        
            
            elapsed = time.time() - start # update the time elapsed
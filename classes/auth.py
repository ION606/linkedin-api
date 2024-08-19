import requests
import sys

# Why is this in a python file? Because the nodejs always returns HTTP 500


[_, username, password] = sys.argv

print(username, password)

AUTHHEADERS = {
        "X-Li-User-Agent": "LIAuthLibrary:0.0.3 com.linkedin.android:4.1.881 Asus_ASUS_Z01QD:android_9",
        "User-Agent": "ANDROID OS",
        "X-User-Language": "en",
        "X-User-Locale": "en_US",
        "Accept-Language": "en-us",
    }


res = requests.get(
f"https://www.linkedin.com/uas/authenticate",
headers=AUTHHEADERS,
)

scookies = res.cookies

payload = {
            "session_key": username,
            "session_password": password,
            "JSESSIONID": scookies["JSESSIONID"],
        }

# self.session.cookies = cookies
#         self.session.headers["csrf-token"] = self.session.cookies["JSESSIONID"].strip(
#             '"'
#         )



# attempt to bypass the CAPTCHA
url = "https://www.linkedin.com/checkpoint/lg/login-challenge-submit?lastCv=AgFZ5ZeTx7tCrAAAAY7uQimE1X7IgBH77ZD3WENAX3Ag4x8TZtzjINmKy-o&_d=d&session_redirect=&vcd=AgGInyRZWZpvSgAAAY7uQky1qELAo1A9Q8uIrW_pobeD_O5eVFEGfVnkAhm7OjlNF--l_YYPbixT5yvxKnv23lrmx5LW8A&pageInstance=urn%3Ali%3Apage%3Ad_checkpoint_ch_captchaV2Challenge%3BfR3yNrJFTJ2Pk03CUmRNLw%3D%3D&controlId=d_checkpoint_ch_captchaV2Challenge-Submit&ut=35EW7sTFMrLrc1"
headers = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://www.linkedin.com/checkpoint/challenge/AgGQ7wuRAH6jgwAAAY7uQimQEUhVjSHHvLpOiDFbjiliykkUTdy5O46FV6DCsi1TQ2V6TYPULzc9AG1ymUdFF7-zFbyAvw?ut=3yYrWkE6YrLrc1",
    "DNT": "1",
    "Sec-GPC": "1",
    "Connection": "keep-alive",
    "Cookie": "JSESSIONID=ajax:2538600735149500238; lang=v=2&lang=en-us; bcookie=\"v=2&ece64a43-fa8f-495d-8f16-942fbfda8432\"; bscookie=\"v=1&202404172251303c0c01ab-29c3-4cfb-8b72-dc6cca67d34dAQFoy9tgTQeA3gYImSFnGmrE-D7LUGdX\"; li_gp=MTsxNzEzMzk0MjkwOzA=; lidc=\"b=OGST04:s=O:r=O:a=O:p=O:g=3159:u=1:x=1:i=1713394290:t=1713480690:v=2:sig=AQGXW3NObtywt8GkIy518CDbVOTkgKAa\"; chp_token=AgGGFUgiWZoEVgAAAY7uQimBzBMFY8ddHZL5K3xcMFMp8q67sR_BKdcnnAS5t9I8QTUhrOZeVLVKm9lrvDziWlt3UQH7tALyInZIQA",
    "Upgrade-Insecure-Requests": "1"
}

# Send the request
response = requests.get(url, headers=headers)

res = requests.post(
    f"https://www.linkedin.com/uas/authenticate",
    data=payload,
    cookies=scookies,
    headers=AUTHHEADERS,
)

print(res.json())
sys.stdout.flush()
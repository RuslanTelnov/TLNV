import requests

def get_wb_image(article):
    vol = int(article) // 100000
    part = int(article) // 1000
    
    hosts = [
        "//basket-01.wbbasket.ru",
        "//basket-02.wbbasket.ru",
        "//basket-03.wbbasket.ru",
        "//basket-04.wbbasket.ru",
        "//basket-05.wbbasket.ru",
        "//basket-06.wbbasket.ru",
        "//basket-07.wbbasket.ru",
        "//basket-08.wbbasket.ru",
        "//basket-09.wbbasket.ru",
        "//basket-10.wbbasket.ru",
        "//basket-11.wbbasket.ru",
        "//basket-12.wbbasket.ru",
        "//basket-13.wbbasket.ru",
        "//basket-14.wbbasket.ru",
        "//basket-15.wbbasket.ru",
    ]
    
    for host in hosts:
        url = f"https:{host}/vol{vol}/part{part}/{article}/images/c516x528/1.jpg"
        try:
            r = requests.head(url)
            if r.status_code == 200:
                print(f"✅ Found image: {url}")
                return url
        except:
            pass
            
    print("❌ Image not found")
    return None

if __name__ == "__main__":
    get_wb_image("123873313")

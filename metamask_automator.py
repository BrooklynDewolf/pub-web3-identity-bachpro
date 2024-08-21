import http.server
import socketserver
import threading
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

# Configuratie van de webserver
PORT = 8000
DIRECTORY = "web"

# Chrome-opties instellen
chrome_options = Options()
chrome_options.add_experimental_option("detach", True)

# Pad naar de MetaMask-extensie
extension_path = 'metamask-chrome-11.14.1'
chrome_options.add_argument(f'--load-extension={extension_path}')

# Informatie over het MetaMask-account
account_info = {
    "passphrase": "already turtle birth enroll since owner keep patch skirt drift any dinner",
    "password": "password1234",
    "address": "0x7e4ABd63A7C8314Cc28D388303472353D884f292"
}


# Functie om MetaMask-account te importeren
def import_metamask_account(passphrase, password):
    # URL van de MetaMask extensie
    driver.get('chrome-extension://edacbflaobojlkbaapclgkedodbllklh/home.html')

    time.sleep(5)  # Wacht tot de MetaMask-extensie is geladen

    # Check de terms checkbox
    agree_terms_button = driver.find_element(By.ID, "onboarding__terms-checkbox")
    agree_terms_button.click()

    # Klik op 'Import Wallet'
    import_wallet_button = driver.find_element(By.XPATH, '//button[contains(text(), "Import an existing wallet")]')
    import_wallet_button.click()

    # Weiger analytics knop
    analytics_deny_button = driver.find_element(By.XPATH, '//button[contains(text(), "No thanks")]')
    analytics_deny_button.click()

    # Vul de geheime zin in
    phrase_inputs = driver.find_elements(By.XPATH, "//input[@type='password']")
    split_phrase = passphrase.split()
    for i in range(len(split_phrase)):
        phrase_inputs[i].send_keys(split_phrase[i])

    # Bevestig de passphrase
    confirm_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Confirm Secret Recovery Phrase')]")
    confirm_button.click()

    # Vul het wachtwoord in
    password_inputs = driver.find_elements(By.XPATH, "//input[@type='password']")
    password_inputs[0].send_keys(password)
    password_inputs[1].send_keys(password)

    # Bevestig dat wachtwoord niet recoverable is
    confirm_password_button = driver.find_element(By.XPATH, "//input[@type='checkbox']")
    confirm_password_button.click()

    # Klik op 'Import'
    import_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Import my wallet')]")
    import_button.click()

    time.sleep(3)

    # Klik op 'Got it'
    gotit_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Got it')]")
    gotit_button.click()

    # Klik op 'Next'
    next_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Next')]")
    next_button.click()

    # Klik op 'Done'
    done_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Done')]")
    done_button.click()


# Functie om een adres in te voeren en op de connect-knop te klikken
def connect_wallet(address):
    demo_account_input = driver.find_element(By.ID, "demoAccount")
    demo_account_input.clear()
    demo_account_input.send_keys(address)

    connect_button = driver.find_element(By.ID, "connectButton")
    connect_button.click()
    time.sleep(6)  # Wacht even om de actie te laten voltooien


# ChromeDriver initialiseren
driver = webdriver.Chrome(options=chrome_options)

# Importeer MetaMask-account
import_metamask_account(account_info["passphrase"], account_info["password"])


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)


def start_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()


# Start de webserver in een aparte thread
server_thread = threading.Thread(target=start_server)
server_thread.daemon = True
server_thread.start()

# Geef de server wat tijd om op te starten
time.sleep(1)

# Navigeer naar de lokale server
driver.get(f"http://localhost:{PORT}")

# Lees de adressen uit het wallets.txt bestand en voer ze in
with open('wallets.txt', 'r') as file:
    addresses = file.readlines()
    total_addresses = len(addresses)
    for index, address in enumerate(addresses):
        connect_wallet(address.strip())
        print(f"Processing address {index + 1} of {total_addresses}")


try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("Server stopped by user")
# Sluit de browser na een bepaalde tijd of na voltooiing van je tests
# driver.quit()

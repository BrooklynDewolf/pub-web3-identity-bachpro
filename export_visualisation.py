import pandas as pd
import matplotlib.pyplot as plt
import json

# Load the CSV file
file_path = 'wallet_summary.csv'
wallet_data = pd.read_csv(file_path, delimiter=';')

# Function to parse the JSON-like strings in the data
def parse_json_column(column):
    return column.apply(lambda x: json.loads(x.replace("'", '"')))

# Parsing the JSON columns for easier manipulation
wallet_data['Transaction Categories'] = parse_json_column(wallet_data['Transaction Categories'])
wallet_data['ERC20 Transaction Categories'] = parse_json_column(wallet_data['ERC20 Transaction Categories'])
wallet_data['NFT Categories'] = parse_json_column(wallet_data['NFT Categories'])

# Function to remove 'unknown' category from a parsed JSON column
def remove_unknown_category(column):
    return column.apply(lambda x: {k: v for k, v in x.items() if k.lower() != 'unknown'})

# 1. Ratio of Wallets with Categorized Transactions vs. Unknown Only
def is_only_unknown(categories):
    return all(k.lower() == 'unknown' for k in categories.keys())

categorized_wallets = wallet_data.apply(lambda row: not is_only_unknown(row['Transaction Categories']) and not is_only_unknown(row['ERC20 Transaction Categories']), axis=1)
unknown_wallets = wallet_data.apply(lambda row: is_only_unknown(row['Transaction Categories']) and is_only_unknown(row['ERC20 Transaction Categories']), axis=1)

categorized_count = categorized_wallets.sum()
unknown_count = unknown_wallets.sum()

labels = ['Categorized', 'Only unknown']
sizes = [categorized_count, unknown_count]
colors = ['lightblue', 'lightcoral']

plt.figure(figsize=(7, 7))
plt.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%', startangle=140)
plt.title('Ratio of wallets with categorized transactions vs. only unknown')
plt.show()

# Removing 'unknown' category for further plotting
wallet_data['Transaction Categories'] = remove_unknown_category(wallet_data['Transaction Categories'])
wallet_data['ERC20 Transaction Categories'] = remove_unknown_category(wallet_data['ERC20 Transaction Categories'])
wallet_data['NFT Categories'] = remove_unknown_category(wallet_data['NFT Categories'])

# 3. Breakdown of Transaction Categories (as percentages)
transaction_categories = wallet_data['Transaction Categories'].apply(pd.Series).fillna(0)
transaction_categories_sum = transaction_categories.sum()

transaction_categories_percent = (transaction_categories_sum / transaction_categories_sum.sum()) * 100

plt.figure(figsize=(10, 6))
transaction_categories_percent.plot(kind='bar', color='salmon')
plt.title('Breakdown of Transaction Categories (ex. unknown)')
plt.xlabel('Transaction Category')
plt.ylabel('Percentage of Total Transactions (%)')
plt.tight_layout()
plt.show()

# 4. Breakdown of ERC-20 Transaction Categories (as percentages)
erc20_transaction_categories = wallet_data['ERC20 Transaction Categories'].apply(pd.Series).fillna(0)
erc20_transaction_categories_sum = erc20_transaction_categories.sum()

erc20_transaction_categories_percent = (erc20_transaction_categories_sum / erc20_transaction_categories_sum.sum()) * 100

plt.figure(figsize=(10, 6))
erc20_transaction_categories_percent.plot(kind='bar', color='lightblue')
plt.title('Breakdown of ERC-20 Transaction Categories (ex. unknown)')
plt.xlabel('ERC-20 Transaction Category')
plt.ylabel('Percentage of Total ERC-20 Transactions (%)')
plt.tight_layout()
plt.show()

# 5. Visualization of NFT Categories (as percentages)
nft_categories = wallet_data['NFT Categories'].apply(pd.Series).fillna(0)
nft_categories_sum = nft_categories.sum()

nft_categories_percent = (nft_categories_sum / nft_categories_sum.sum()) * 100

plt.figure(figsize=(10, 6))
nft_categories_percent.plot(kind='bar', color='lightgreen')
plt.title('Visualization of NFT Categories (ex. unknown)')
plt.xlabel('NFT Category')
plt.ylabel('Percentage of Total NFTs (%)')
plt.tight_layout()
plt.show()
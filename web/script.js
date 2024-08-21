import {
  getAccountBalance,
  getERC20Transactions,
  getNFTs,
  getTransactions,
} from "./apihandler.js";

const connectButton = document.getElementById("connectButton");
const exportButton = document.getElementById("exportButton");
const clearButton = document.getElementById("clearButton");
const transactionNextPageButton = document.getElementById("tran-next-page");
const transactionPrevPageButton = document.getElementById("tran-prev-page");
const transactionPageInfo = document.getElementById("tran-page-info");
const erc20NextPageButton = document.getElementById("erc20-next-page");
const erc20PrevPageButton = document.getElementById("erc20-prev-page");
const erc20PageInfo = document.getElementById("erc20-page-info");
const demoAccountInput = document.getElementById("demoAccount");
const walletAddressElement = document.getElementById("walletAddress");
const walletBalanceElement = document.getElementById("walletBalance");
const firstTransactionDate = document.getElementById("transaction-first");
const lastTransactionDate = document.getElementById("transaction-last");
const firstERC20Date = document.getElementById("erc20-transaction-first");
const lastERC20Date = document.getElementById("erc20-transaction-last");

const transactionsTableBody = document
  .getElementById("transactionsTable")
  .getElementsByTagName("tbody")[0];
const erc20TransactionsTableBody = document
  .getElementById("tokensTable")
  .getElementsByTagName("tbody")[0];
const nftsTableBody = document
  .getElementById("nftsTable")
  .getElementsByTagName("tbody")[0];

const NO_TRANSACTIONS_FOUND = "No transactions found";
const NO_NFTS_FOUND = "No NFTs found";
const METAMASK_NOT_INSTALLED = "MetaMask not installed";
const CONNECTION_FAILED = "Connection failed";

let address = "";
let transactionCategories = {};

let transactionCurrentPage = 1;
let erc20CurrentPage = 1;
const transactionsPerPage = 10;

let allTransactions = [];
let allERC20Transactions = [];
let allNFTs = [];

let allSummaries = [];

window.onload = async () => {
  updatePaginationControls(
    transactionPageInfo,
    transactionPrevPageButton,
    transactionNextPageButton,
    0,
    transactionCurrentPage,
    transactionsPerPage,
  );
  updatePaginationControls(
    erc20PageInfo,
    erc20PrevPageButton,
    erc20NextPageButton,
    0,
    erc20CurrentPage,
    transactionsPerPage,
  );
};

connectButton.addEventListener("click", async (event) => {
  event.preventDefault();
  if (typeof window.ethereum !== "undefined") {
    console.log("MetaMask is installed!");
    try {
      transactionCurrentPage = 1;
      erc20CurrentPage = 1;
      address = demoAccountInput.value || (await getMetaMaskAccount());
      const balance = await getWalletBalance(address);
      await getWalletTransactions(address);
      await getERC20WalletTransactions(address);
      await getUserNFTs(address);

      walletAddressElement.innerText = `${address}`;
      walletBalanceElement.innerText = `${balance}`;

      await fetchAndAnalyzeData();
    } catch (error) {
      console.error("User denied account access or there's an error: ", error);
      walletAddressElement.innerText = `${CONNECTION_FAILED}`;
    }
  } else {
    alert(
      "Please install MetaMask or another Ethereum-compatible browser extension.",
    );
    walletAddressElement.innerText = `${METAMASK_NOT_INSTALLED}`;
  }
});

exportButton.addEventListener("click", async (event) => {
  event.preventDefault();
  generateCSV();
});

clearButton.addEventListener("click", async (event) => {
  event.preventDefault();
  allSummaries = [];
  alert("Data cleared!");
});

transactionNextPageButton.addEventListener("click", async (event) => {
  transactionCurrentPage++;
  paginateTransactions(transactionCurrentPage);
});

transactionPrevPageButton.addEventListener("click", async (event) => {
  if (transactionCurrentPage > 1) {
    transactionCurrentPage--;
    paginateTransactions(transactionCurrentPage);
  }
});

erc20NextPageButton.addEventListener("click", async (event) => {
  erc20CurrentPage++;
  paginateERC20Transactions(erc20CurrentPage);
});

erc20PrevPageButton.addEventListener("click", async (event) => {
  if (erc20CurrentPage > 1) {
    erc20CurrentPage--;
    paginateERC20Transactions(erc20CurrentPage);
  }
});

async function getMetaMaskAccount() {
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  return accounts[0];
}

async function loadDAppAddresses() {
  try {
    const response = await fetch("dapps.json");
    transactionCategories = await response.json();
  } catch (error) {
    console.error("Error loading dApp address library:", error);
  }
}

async function getWalletBalance(address) {
  if (!demoAccountInput.value) {
    const web3 = new Web3(window.ethereum);
    const balance = await web3.eth.getBalance(address);
    return Number(balance) / 1e18;
  } else {
    const wei_balance = await getAccountBalance(address);
    return Number(wei_balance.result) / 1e18;
  }
}

async function getWalletTransactions(address) {
  try {
    const transactions = await getTransactions(address, 1, "desc", 10000); // Fetch all transactions
    allTransactions = transactions.result;
    paginateTransactions(1);
  } catch (error) {
    transactionsTableBody.innerText = `Error fetching transactions: ${error.message}`;
  }
}

async function getERC20WalletTransactions(address) {
  try {
    const transactions = await getERC20Transactions(address, 1, "desc", 10000); // Fetch all ERC20 transactions
    allERC20Transactions = transactions.result;
    paginateERC20Transactions(1);
  } catch (error) {
    erc20TransactionsTableBody.innerText = `Error fetching ERC20 transactions: ${error.message}`;
  }
}

async function getUserNFTs(address) {
  try {
    const nfts = await getNFTs(address);
    allNFTs = nfts.nfts;
    populateTable(nftsTableBody, allNFTs, populateNFTsRow, NO_NFTS_FOUND);
  } catch (error) {
    nftsTableBody.innerText = `Error fetching NFTs: ${error.message}`;
  }
}

function logWalletSummary() {
  const summary = {
    walletAddress: address,
    totalTransactions: allTransactions.length,
    totalERC20Transactions: allERC20Transactions.length,
    transactionCategories: analyzeTransactionCategories(allTransactions),
    erc20TransactionCategories:
      analyzeTransactionCategories(allERC20Transactions),
    nftCategories: analyzeNFTCategories(allNFTs),
  };
  allSummaries.push(summary);
}

function generateCSV() {
  const csvContent = [
    [
      "Wallet Address",
      "Total Transactions",
      "Total ERC20 Transactions",
      "Transaction Categories",
      "ERC20 Transaction Categories",
      "NFT Categories",
    ],
    ...allSummaries.map((summary) => [
      summary.walletAddress,
      summary.totalTransactions,
      summary.totalERC20Transactions,
      JSON.stringify(summary.transactionCategories),
      JSON.stringify(summary.erc20TransactionCategories),
      JSON.stringify(summary.nftCategories),
    ]),
  ]
    .map((e) => e.join(";"))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "wallet_summary.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function fetchAndAnalyzeData() {
  const transactionCategories = analyzeTransactionCategories(allTransactions);
  const erc20TransactionCategories =
    analyzeTransactionCategories(allERC20Transactions);
  const nftCategories = analyzeNFTCategories(allNFTs);
  const erc20Tokens = analyzeERC20Tokens(allERC20Transactions);

  displayProfileSummary(
    transactionCategories,
    erc20TransactionCategories,
    nftCategories,
    erc20Tokens,
  );

  logWalletSummary(); // Log summary to console for data gathering
}

function analyzeTransactionCategories(transactions) {
  const categories = {};
  transactions.forEach((tx) => {
    const category = getTransactionCategory(tx).split(" / ")[0]; // Only take the category itself
    if (categories[category]) {
      categories[category]++;
    } else {
      categories[category] = 1;
    }
  });
  return categories;
}

function analyzeNFTCategories(nfts) {
  const categories = {};
  nfts.forEach((nft) => {
    const category = getTokenStandardCategory(nft.token_standard);
    if (categories[category]) {
      categories[category]++;
    } else {
      categories[category] = 1;
    }
  });
  return categories;
}

function analyzeERC20Tokens(erc20Transactions) {
  const tokens = {};
  erc20Transactions.forEach((tx) => {
    const tokenName = tx.tokenName;
    if (tokens[tokenName]) {
      tokens[tokenName]++;
    } else {
      tokens[tokenName] = 1;
    }
  });
  return tokens;
}

function paginateTransactions(page) {
  const start = (page - 1) * transactionsPerPage;
  const end = start + transactionsPerPage;
  const paginatedTransactions = allTransactions.slice(start, end);

  populateTable(
    transactionsTableBody,
    paginatedTransactions,
    populateTransactionRow,
    NO_TRANSACTIONS_FOUND,
  );

  updatePaginationControls(
    transactionPageInfo,
    transactionPrevPageButton,
    transactionNextPageButton,
    paginatedTransactions.length,
    page,
    transactionsPerPage,
  );

  if (allTransactions.length > 0) {
    firstTransactionDate.innerText = new Date(
      allTransactions[allTransactions.length - 1].timeStamp * 1000,
    ).toLocaleString();
    lastTransactionDate.innerText = new Date(
      allTransactions[0].timeStamp * 1000,
    ).toLocaleString();
  } else {
    firstTransactionDate.innerText = "N/A";
    lastTransactionDate.innerText = "N/A";
  }
}

function paginateERC20Transactions(page) {
  const start = (page - 1) * transactionsPerPage;
  const end = start + transactionsPerPage;
  const paginatedTransactions = allERC20Transactions.slice(start, end);

  populateTable(
    erc20TransactionsTableBody,
    paginatedTransactions,
    populateERC20TransactionRow,
    NO_TRANSACTIONS_FOUND,
  );

  updatePaginationControls(
    erc20PageInfo,
    erc20PrevPageButton,
    erc20NextPageButton,
    paginatedTransactions.length,
    page,
    transactionsPerPage,
  );

  if (allERC20Transactions.length > 0) {
    firstERC20Date.innerText = new Date(
      allERC20Transactions[allERC20Transactions.length - 1].timeStamp * 1000,
    ).toLocaleString();
    lastERC20Date.innerText = new Date(
      allERC20Transactions[0].timeStamp * 1000,
    ).toLocaleString();
  } else {
    firstERC20Date.innerText = "N/A";
    lastERC20Date.innerText = "N/A";
  }
}

function updatePaginationControls(
  pageInfoElement,
  prevButton,
  nextButton,
  itemsCount,
  currentPage,
  itemsPerPage,
) {
  pageInfoElement.innerText = `Page ${currentPage}`;
  prevButton.disabled = currentPage === 1;
  nextButton.disabled = itemsCount < itemsPerPage;
}

function convertValue(value, tokenDecimal) {
  const valueBigInt = BigInt(value);
  const decimalPlaces = Number(tokenDecimal);
  const divisor = BigInt(10 ** decimalPlaces);
  const result = Number(valueBigInt) / Number(divisor);
  return result;
}

function populateTable(tableBody, items, populateRowFunction, noItemsMessage) {
  tableBody.innerHTML = "";
  if (items.length === 0) {
    const row = tableBody.insertRow();
    const cell = row.insertCell(0);
    cell.colSpan = 5;
    cell.innerText = noItemsMessage;
    return;
  }
  items.forEach((item) => populateRowFunction(tableBody, item));
}

function populateTransactionRow(tableBody, tx) {
  const row = tableBody.insertRow();
  const timestampCell = row.insertCell(0);
  const fromCell = row.insertCell(1);
  const toCell = row.insertCell(2);
  const amountCell = row.insertCell(3);
  const categoryCell = row.insertCell(4);

  const date = new Date(tx.timeStamp * 1000);
  timestampCell.innerText = date.toLocaleString();
  fromCell.innerText = tx.from;
  fromCell.classList.add("text-truncate");
  if (tx.from.toLowerCase() === address.toLowerCase()) {
    fromCell.classList.add("font-weight-bold");
  } else {
    toCell.classList.add("font-weight-bold");
  }
  toCell.innerText = tx.to;
  toCell.classList.add("text-truncate");
  amountCell.innerText = tx.value / 1e18;

  // const icon = document.createElement("i");
  // icon.classList.add("fa-solid", "fa-magnifying-glass");
  // console.log(tx.contractAddress);
  // icon.dataset.contract = tx.contractAddress;
  // categoryCell.appendChild(icon);

  categoryCell.innerText = getTransactionCategory(tx);
}

function populateERC20TransactionRow(tableBody, tx) {
  const row = tableBody.insertRow();
  const timestampCell = row.insertCell(0);
  const tokenCell = row.insertCell(1);
  const valueCell = row.insertCell(2);
  const fromCell = row.insertCell(3);
  const toCell = row.insertCell(4);
  const categoryCell = row.insertCell(5);

  const date = new Date(tx.timeStamp * 1000);
  const formattedValue = convertValue(tx.value, tx.tokenDecimal);
  timestampCell.innerText = date.toLocaleString();
  tokenCell.innerText = tx.tokenName;
  valueCell.innerText = `${formattedValue} ${tx.tokenSymbol}`;
  fromCell.innerText = tx.from;
  fromCell.classList.add("text-truncate");
  if (tx.from.toLowerCase() === address.toLowerCase()) {
    fromCell.classList.add("font-weight-bold");
  } else {
    toCell.classList.add("font-weight-bold");
  }
  toCell.innerText = tx.to;
  toCell.classList.add("text-truncate");

  // const icon = document.createElement("i");
  // icon.classList.add("fa-solid", "fa-magnifying-glass");
  // icon.dataset.contract = tx.contractAddress;
  // categoryCell.appendChild(icon);

  categoryCell.innerText = getTransactionCategory(tx);
}

function populateNFTsRow(tableBody, tx) {
  const row = tableBody.insertRow();
  const imageCell = row.insertCell(0);
  const identifierCell = row.insertCell(1);
  const tokenCell = row.insertCell(2);
  const collectionCell = row.insertCell(3);
  const contractCell = row.insertCell(4);
  const categoryCell = row.insertCell(5);

  const nft_image = document.createElement("img");
  nft_image.src = tx.image_url;
  nft_image.alt = "NFT";
  nft_image.style.height = "100px";
  imageCell.appendChild(nft_image);
  identifierCell.innerText = tx.identifier;
  identifierCell.classList.add("text-truncate");
  tokenCell.innerText = tx.token_standard;
  collectionCell.innerText = tx.collection;
  contractCell.innerText = tx.contract;
  contractCell.classList.add("text-truncate");
  categoryCell.innerText = getTokenStandardCategory(tx.token_standard);
}

function displayProfileSummary(
  transactionCategories,
  erc20TransactionCategories,
  nftCategories,
  erc20Tokens,
) {
  Chart.helpers.each(Chart.instances, function (instance) {
    instance.destroy();
  });

  if (
    !Object.keys(transactionCategories).length &&
    !Object.keys(erc20TransactionCategories).length &&
    !Object.keys(nftCategories).length &&
    !Object.keys(erc20Tokens).length
  ) {
    console.log("No data to display in charts.");
    return;
  }

  generatePieChart(
    "transactionCategoriesChart",
    "Transaction Categories",
    transactionCategories,
  );
  generatePieChart(
    "erc20TransactionCategoriesChart",
    "ERC-20 Transaction Categories",
    erc20TransactionCategories,
  );
  generatePieChart("nftCategoriesChart", "NFT Categories", nftCategories);
  generateBarChart("erc20TokensChart", "ERC-20 Tokens", erc20Tokens);
}

function generatePieChart(canvasId, title, data) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
  canvas.height = 300;

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(data),
      datasets: [
        {
          data: Object.values(data),
          backgroundColor: [
            "rgba(255, 99, 132, 0.2)",
            "rgba(54, 162, 235, 0.2)",
            "rgba(255, 206, 86, 0.2)",
            "rgba(75, 192, 192, 0.2)",
            "rgba(153, 102, 255, 0.2)",
            "rgba(255, 159, 64, 0.2)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: title,
        },
      },
    },
  });
}

function generateBarChart(canvasId, title, data) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
  canvas.height = 300;

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(data),
      datasets: [
        {
          data: Object.values(data),
          backgroundColor: [
            "rgba(255, 99, 132, 0.2)",
            "rgba(54, 162, 235, 0.2)",
            "rgba(255, 206, 86, 0.2)",
            "rgba(75, 192, 192, 0.2)",
            "rgba(153, 102, 255, 0.2)",
            "rgba(255, 159, 64, 0.2)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: title,
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
      },
    },
  });
}

function getTokenStandardCategory(tokenStandard) {
  switch (tokenStandard) {
    case "erc721":
      return "digital art";
    case "erc1155":
      return "game-items";
    default:
      return "unknown";
  }
}

function getTransactionCategory(tx) {
  const keysToCheck = [tx.to, tx.from, tx.contractAddress];
  for (const key of keysToCheck) {
    if (transactionCategories[key]) {
      return transactionCategories[key.toLowerCase()];
    }
  }
  return "unknown";
}

loadDAppAddresses();

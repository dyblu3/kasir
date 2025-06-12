// Sample products data
let products = [
  { id: 1, name: 'Spaghetti Carbonara', category: 'food', price: 45000, stock: 20, barcode: '1234567890' },
  { id: 2, name: 'Margherita Pizza', category: 'food', price: 65000, stock: 15, barcode: '2345678901' },
  { id: 3, name: 'Iced Latte', category: 'drink', price: 25000, stock: 30, barcode: '3456789012' },
  { id: 4, name: 'Orange Juice', category: 'drink', price: 20000, stock: 25, barcode: '4567890123' },
  { id: 5, name: 'Chocolate Cake', category: 'snack', price: 35000, stock: 12, barcode: '5678901234' },
  { id: 6, name: 'Potato Chips', category: 'snack', price: 15000, stock: 35, barcode: '6789012345' },
  { id: 7, name: 'Mineral Water', category: 'drink', price: 10000, stock: 50, barcode: '7890123456' },
  { id: 8, name: 'Cheeseburger', category: 'food', price: 35000, stock: 18, barcode: '8901234567' },
];

let editingProductId = null;

let currentTransaction = {
  items: [],
  customer: '',
  paymentMethod: 'cash',
  cashReceived: 0,
  change: 0,
  discount: 0,
  subtotal: 0,
  total: 0,
  timestamp: ''
};

let transactions = [];

const productList = document.getElementById('product-list');
const cartItems = document.getElementById('cart-items');
const emptyCartMessage = document.getElementById('empty-cart-message');
const subtotalElement = document.getElementById('subtotal');
const totalElement = document.getElementById('total');
const customerNameInput = document.getElementById('customer-name');
const clearCustomerBtn = document.getElementById('clear-customer');
const paymentMethodSelect = document.getElementById('payment-method');
const cashReceivedInput = document.getElementById('cash-received');
const customerChangeInput = document.getElementById('customer-change');
const cashReceivedWrap = document.getElementById('cash-received-wrap');
const customerChangeWrap = document.getElementById('customer-change-wrap');
const cancelTransactionBtn = document.getElementById('cancel-transaction');
const processPaymentBtn = document.getElementById('process-payment');
const transactionHistory = document.getElementById('transaction-history');
const emptyTransactions = document.getElementById('empty-transactions');
const searchProductInput = document.getElementById('search-product');
const addProductBtn = document.getElementById('add-product-btn');
const productModal = document.getElementById('product-modal');
const saveProductBtn = document.getElementById('save-product');
const cancelProductBtn = document.getElementById('cancel-product');
const receiptModal = document.getElementById('receipt-modal');
const printReceiptBtn = document.getElementById('print-receipt');
const closeReceiptBtn = document.getElementById('close-receipt');
const currentTimeElement = document.getElementById('current-time');
const currentDateElement = document.getElementById('current-date');
const discountInput = document.getElementById('discount-input');

function init() {
  renderProducts();
  updateDateTime();
  setInterval(updateDateTime, 1000);

  paymentMethodSelect.addEventListener('change', updatePaymentFields);
  cashReceivedInput.addEventListener('input', updateChange);
  discountInput.addEventListener('input', updateSummary);

  clearCustomerBtn.addEventListener('click', () => {
      customerNameInput.value = '';
      currentTransaction.customer = '';
  });
  cancelTransactionBtn.addEventListener('click', resetTransaction);
  processPaymentBtn.addEventListener('click', processPayment);
  searchProductInput.addEventListener('input', renderProducts);
  addProductBtn.addEventListener('click', () => {
      editingProductId = null;
      resetProductModal();
      productModal.classList.remove('hidden');
  });
  saveProductBtn.addEventListener('click', saveProduct);
  cancelProductBtn.addEventListener('click', () => productModal.classList.add('hidden'));
  printReceiptBtn.addEventListener('click', printReceipt);
  closeReceiptBtn.addEventListener('click', () => receiptModal.classList.add('hidden'));
  customerNameInput.addEventListener('change', (e) => {
      currentTransaction.customer = e.target.value;
  });

  updatePaymentFields();
}

function renderProducts() {
  productList.innerHTML = '';
  const searchTerm = searchProductInput.value.toLowerCase();

  const filteredProducts = products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) || 
      product.barcode.includes(searchTerm)
  );

  if (filteredProducts.length === 0) {
      productList.innerHTML = `
          <div class="col-span-full text-center py-10 text-gray-500">
              <i class="fas fa-search fa-2x mb-2"></i>
              <p>No products found</p>
          </div>
      `;
      return;
  }

  filteredProducts.forEach(product => {
      const productCard = document.createElement('div');
      productCard.className = 'flex flex-col items-center bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-blue-50 transition-colors';
      productCard.innerHTML = `
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              ${getProductIcon(product.category)}
          </div>
          <div class="text-center">
              <h3 class="font-medium text-sm truncate w-full">${product.name}</h3>
              <p class="text-blue-600 font-bold">Rp ${product.price.toLocaleString()}</p>
              <p class="text-xs text-gray-500">Stock: ${product.stock}</p>
          </div>
          <div class="flex space-x-2 mt-2">
              <button class="edit-product-btn text-blue-600 text-xs" data-id="${product.id}">
                  <i class="fas fa-edit"></i>
              </button>
              <button class="delete-product-btn text-red-600 text-xs" data-id="${product.id}">
                  <i class="fas fa-trash-alt"></i>
              </button>
          </div>
      `;
      productCard.addEventListener('click', (e) => {
          if (e.target.closest('.edit-product-btn') || e.target.closest('.delete-product-btn')) {
              return;
          }
          addToCart(product);
      });

      productCard.querySelector('.edit-product-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          editProduct(product);
      });

      productCard.querySelector('.delete-product-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          deleteProduct(product.id);
      });

      productList.appendChild(productCard);
  });
}

function getProductIcon(category) {
  const icons = {
      'food': '<i class="fas fa-utensils text-blue-500"></i>',
      'drink': '<i class="fas fa-coffee text-blue-500"></i>',
      'snack': '<i class="fas fa-cookie text-blue-500"></i>',
      'other': '<i class="fas fa-box text-blue-500"></i>'
  };
  return icons[category] || icons['other'];
}

function addToCart(product) {
  const existingItem = currentTransaction.items.find(item => item.id === product.id);

  if (existingItem) {
      if (existingItem.quantity < product.stock) {
          existingItem.quantity += 1;
      } else {
          alert(`Only ${product.stock} items available in stock!`);
          return;
      }
  } else {
      currentTransaction.items.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1
      });
  }

  updateCart();
}

function editProduct(product) {
  editingProductId = product.id;
  document.getElementById('product-name').value = product.name;
  document.getElementById('product-category').value = product.category;
  document.getElementById('product-price').value = product.price;
  document.getElementById('product-stock').value = product.stock;
  document.getElementById('product-barcode').value = product.barcode;
  document.getElementById('modal-title').innerHTML = `<i class="fas fa-edit mr-2 text-blue-500"></i>Edit Product`;
  saveProductBtn.textContent = "Update Product";
  productModal.classList.remove('hidden');
}

function deleteProduct(productId) {
  if (confirm('Are you sure you want to delete this product?')) {
      products = products.filter(p => p.id !== productId);
      renderProducts();
  }
}

function resetProductModal() {
  document.getElementById('product-name').value = '';
  document.getElementById('product-category').value = 'food';
  document.getElementById('product-price').value = '';
  document.getElementById('product-stock').value = '';
  document.getElementById('product-barcode').value = '';
  document.getElementById('modal-title').innerHTML = `<i class="fas fa-plus-circle mr-2 text-blue-500"></i>Add New Product`;
  saveProductBtn.textContent = "Save Product";
}

function saveProduct() {
  const name = document.getElementById('product-name').value.trim();
  const category = document.getElementById('product-category').value;
  const price = parseFloat(document.getElementById('product-price').value);
  const stock = parseInt(document.getElementById('product-stock').value);
  const barcode = document.getElementById('product-barcode').value.trim();

  if (!name || isNaN(price) || price <= 0 || isNaN(stock) || stock <= 0 || !barcode) {
      alert('Please fill all fields with valid values!');
      return;
  }

  const barcodeExists = products.some(p => p.barcode === barcode && p.id !== editingProductId);
  if (barcodeExists) {
      alert('Product with this barcode already exists!');
      return;
  }

  if (editingProductId) {
      products = products.map(p => {
          if (p.id === editingProductId) {
              return { ...p, name, category, price, stock, barcode };
          }
          return p;
      });
  } else {
      const newProduct = {
          id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
          name,
          category,
          price,
          stock,
          barcode
      };
      products.unshift(newProduct);
  }

  productModal.classList.add('hidden');
  renderProducts();
}

function updateCart() {
  cartItems.innerHTML = '';

  if (currentTransaction.items.length === 0) {
      emptyCartMessage.classList.remove('hidden');
      updateSummary();
      return;
  }

  emptyCartMessage.classList.add('hidden');

  currentTransaction.items.forEach(item => {
      const cartItem = document.createElement('div');
      cartItem.className = 'flex justify-between items-center py-2 border-b';
      cartItem.innerHTML = `
          <div class="flex-1">
              <h3 class="font-medium">${item.name}</h3>
              <p class="text-sm text-gray-500">Rp ${item.price.toLocaleString()} x ${item.quantity}</p>
          </div>
          <div class="flex items-center">
              <span class="font-semibold mr-4">Rp ${(item.price * item.quantity).toLocaleString()}</span>
              <div class="flex space-x-1">
                  <button class="decrease-btn w-6 h-6 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200" data-id="${item.id}">
                      <i class="fas fa-minus" data-id="${item.id}"></i>
                  </button>
                  <button class="increase-btn w-6 h-6 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200" data-id="${item.id}">
                      <i class="fas fa-plus" data-id="${item.id}"></i>
                  </button>
                  <button class="remove-btn w-6 h-6 rounded-full bg-red-100 text-red-600 hover:bg-red-200" data-id="${item.id}">
                      <i class="fas fa-trash" data-id="${item.id}"></i>
                  </button>
              </div>
          </div>
      `;
      cartItems.appendChild(cartItem);
  });

  document.querySelectorAll('.decrease-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
          const productId = parseInt(e.target.getAttribute('data-id'));
          decreaseQuantity(productId);
      });
  });

  document.querySelectorAll('.increase-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
          const productId = parseInt(e.target.getAttribute('data-id'));
          increaseQuantity(productId);
      });
  });

  document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
          const productId = parseInt(e.target.getAttribute('data-id'));
          removeFromCart(productId);
      });
  });

  updateSummary();
}

function decreaseQuantity(productId) {
  const item = currentTransaction.items.find(item => item.id === productId);
  if (item) {
      if (item.quantity > 1) {
          item.quantity -= 1;
      } else {
          currentTransaction.items = currentTransaction.items.filter(item => item.id !== productId);
      }
      updateCart();
  }
}

function increaseQuantity(productId) {
  const item = currentTransaction.items.find(item => item.id === productId);
  if (item) {
      const product = products.find(p => p.id === productId);
      if (item.quantity < product.stock) {
          item.quantity += 1;
          updateCart();
      } else {
          alert(`Only ${product.stock} items available in stock!`);
      }
  }
}

function removeFromCart(productId) {
  currentTransaction.items = currentTransaction.items.filter(item => item.id !== productId);
  updateCart();
}

function updateSummary() {
  currentTransaction.subtotal = currentTransaction.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountPercentage = parseFloat(discountInput.value) || 0;
  const discountAmount = currentTransaction.subtotal * (discountPercentage / 100);
  currentTransaction.discount = discountAmount;
  currentTransaction.total = currentTransaction.subtotal - discountAmount;

  subtotalElement.textContent = `Rp ${currentTransaction.subtotal.toLocaleString()}`;
  totalElement.textContent = `Rp ${currentTransaction.total.toLocaleString()}`;

  if (currentTransaction.paymentMethod === 'cash') {
      updateChange();
  }
}

function updatePaymentFields() {
  currentTransaction.paymentMethod = paymentMethodSelect.value;
  if (currentTransaction.paymentMethod === 'cash') {
      cashReceivedWrap.style.display = '';
      customerChangeWrap.style.display = '';
      cashReceivedInput.disabled = false;
      cashReceivedInput.value = '';
      customerChangeInput.value = '';
      updateChange();
  } else {
      cashReceivedWrap.style.display = 'none';
      customerChangeWrap.style.display = 'none';
      cashReceivedInput.value = '';
      customerChangeInput.value = '';
  }
}

function updateChange() {
  const cashReceived = parseFloat(cashReceivedInput.value) || 0;
  const change = cashReceived - currentTransaction.total;
  currentTransaction.cashReceived = cashReceived;

  if (change >= 0) {
      customerChangeInput.value = change.toFixed(2);
      currentTransaction.change = change;
  } else {
      customerChangeInput.value = '';
      currentTransaction.change = 0;
  }
}

function processPayment() {
  if (currentTransaction.items.length === 0) {
      alert('Please add items to the cart first!');
      return;
  }

  if (currentTransaction.paymentMethod === 'cash' && currentTransaction.cashReceived < currentTransaction.total) {
      alert('Cash received is less than total amount!');
      return;
  }

  const now = new Date();
  currentTransaction.timestamp = now.toLocaleString();

  const transaction = JSON.parse(JSON.stringify(currentTransaction));
  transaction.id = transactions.length + 1;

  transaction.items.forEach(item => {
      const product = products.find(p => p.id === item.id);
      if (product) {
          product.stock -= item.quantity;
      }
  });

  transactions.unshift(transaction);
  renderTransactionHistory();
  showReceipt(transaction);
  resetTransaction();
}

function resetTransaction() {
  currentTransaction = {
      items: [],
      customer: '',
      paymentMethod: 'cash',
      cashReceived: 0,
      change: 0,
      discount: 0,
      subtotal: 0,
      total: 0,
      timestamp: ''
  };

  customerNameInput.value = '';
  paymentMethodSelect.value = 'cash';
  cashReceivedInput.value = '';
  customerChangeInput.value = '';
  discountInput.value = '0';

  updateCart();
  updatePaymentFields();
}

function renderTransactionHistory() {
  transactionHistory.innerHTML = '';

  if (transactions.length === 0) {
      emptyTransactions.classList.remove('hidden');
      return;
  }

  emptyTransactions.classList.add('hidden');

  transactions.forEach(transaction => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-gray-50';
      tr.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${transaction.id}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${transaction.timestamp}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${transaction.customer || 'Walk-in'}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${transaction.items.length} items</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">Rp ${transaction.total.toLocaleString()}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">${transaction.paymentMethod}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button class="view-receipt-btn text-blue-600 hover:text-blue-900 mr-3" data-id="${transaction.id}">
                  <i class="fas fa-receipt" data-id="${transaction.id}"></i>
              </button>
              <button class="refund-btn text-red-600 hover:text-red-900" data-id="${transaction.id}">
                  <i class="fas fa-undo" data-id="${transaction.id}"></i>
              </button>
          </td>
      `;
      transactionHistory.appendChild(tr);
  });

  document.querySelectorAll('.view-receipt-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
          const transactionId = parseInt(e.target.getAttribute('data-id'));
          viewReceipt(transactionId);
      });
  });

  document.querySelectorAll('.refund-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
          const transactionId = parseInt(e.target.getAttribute('data-id'));
          refundTransaction(transactionId);
      });
  });
}

function showReceipt(transaction) {
  const receiptElement = document.getElementById('receipt-to-print');
  receiptElement.innerHTML = `
      <div class="text-center mb-2">
          <h2 class="font-bold text-base">SMART POS SYSTEM</h2>
          <p class="text-xs">Jl. Example No. 123, City</p>
          <p class="text-xs">Telp: (021) 123-4567</p>
      </div>
      
      <div class="border-t border-b border-black py-1 my-1 text-xs">
          <div class="flex justify-between">
              <span>Receipt:</span>
              <span>${transaction.id}</span>
          </div>
          <div class="flex justify-between">
              <span>Date:</span>
              <span>${transaction.timestamp}</span>
          </div>
          <div class="flex justify-between">
              <span>Customer:</span>
              <span>${transaction.customer || 'Walk-in'}</span>
          </div>
          <div class="flex justify-between">
              <span>Payment:</span>
              <span class="capitalize">${transaction.paymentMethod}</span>
          </div>
      </div>
      
      <div class="border-b border-black py-1 mb-1 text-xs">
          <div class="flex justify-between font-bold">
              <span>ITEM</span>
              <span>TOTAL</span>
          </div>
          ${transaction.items.map(item => `
              <div class="flex justify-between">
                  <span>${item.name} (${item.quantity} x Rp ${item.price.toLocaleString()})</span>
                  <span>Rp ${(item.price * item.quantity).toLocaleString()}</span>
              </div>
          `).join('')}
      </div>
      
      <div class="text-xs mb-2">
          <div class="flex justify-between">
              <span>Subtotal:</span>
              <span>Rp ${transaction.subtotal.toLocaleString()}</span>
          </div>
          <div class="flex justify-between">
              <span>Discount:</span>
              <span>${(discountInput.value)}% (Rp ${transaction.discount.toLocaleString()})</span>
          </div>
          <div class="flex justify-between font-bold border-t mt-1 pt-1">
              <span>TOTAL:</span>
              <span>Rp ${transaction.total.toLocaleString()}</span>
          </div>
          ${transaction.paymentMethod === 'cash' ? `
              <div class="flex justify-between">
                  <span>Cash:</span>
                  <span>Rp ${transaction.cashReceived.toLocaleString()}</span>
              </div>
              <div class="flex justify-between">
                  <span>Change:</span>
                  <span>Rp ${transaction.change.toLocaleString()}</span>
              </div>
          ` : ''}
      </div>
      
      <div class="text-center text-xs mt-4">
          <p>Thank you for your purchase!</p>
          <p class="text-xs mt-2">*** This is an computer-generated receipt ***</p>
      </div>
  `;

  receiptModal.classList.remove('hidden');
}

function viewReceipt(transactionId) {
  const transaction = transactions.find(t => t.id === transactionId);
  if (transaction) {
      showReceipt(transaction);
  }
}

function refundTransaction(transactionId) {
  if (!confirm('Are you sure you want to refund this transaction?')) return;

  const transactionIndex = transactions.findIndex(t => t.id === transactionId);
  if (transactionIndex !== -1) {
      const transaction = transactions[transactionIndex];
      transaction.items.forEach(item => {
          const product = products.find(p => p.id === item.id);
          if (product) {
              product.stock += item.quantity;
          }
      });
      transactions.splice(transactionIndex, 1);
      renderTransactionHistory();
      renderProducts();
      alert('Transaction has been refunded successfully!');
  }
}

function printReceipt() {
  window.print();
}

function updateDateTime() {
  const now = new Date();
  currentTimeElement.textContent = now.toLocaleTimeString();
  currentDateElement.textContent = now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
  });
}

document.addEventListener('DOMContentLoaded', init);

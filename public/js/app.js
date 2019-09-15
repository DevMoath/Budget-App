class UI {
    constructor() {
        this.budgetFeedback = document.querySelector(".budget-feedback");
        this.expenseFeedback = document.querySelector(".expense-feedback");
        this.budgetForm = document.getElementById("budget-form");
        this.budgetInput = document.getElementById("budget-input");
        this.budgetAmount = document.getElementById("budget-amount");
        this.expenseAmount = document.getElementById("expense-amount");
        this.balance = document.getElementById("balance");
        this.balanceAmount = document.getElementById("balance-amount");
        this.expenseForm = document.getElementById("expense-form");
        this.expenseInput = document.getElementById("expense-input");
        this.amountInput = document.getElementById("amount-input");
        this.expenseList = document.getElementById("expense-list");
        this.itemList = [];
        this.itemID = 0;
    }

    submitBudgetForm() {
        const value = this.budgetInput.value;
        if (value === '' || value < 0) {
            this.budgetFeedback.classList.add('showItem');
            this.budgetFeedback.innerHTML = '<p>Value can\'t be empty or negative</p>'
            const self = this
            setTimeout(function () {
                self.budgetFeedback.classList.remove('showItem');
            }, 4000);
        } else {
            this.budgetAmount.textContent = value;
            this.budgetInput.value = '';
            this.showBalance();
        }
    }

    showBalance() {
        const expense = this.totalExpense();
        const total = parseInt(this.budgetAmount.textContent) - expense;
        this.balanceAmount.textContent = total;
        if (total < 0) {
            this.balance.classList.remove('showGreen', 'showBlack');
            this.balance.classList.add('showRed');
        } else if (total > 0) {
            this.balance.classList.remove('showBlack', 'showRed');
            this.balance.classList.add('showGreen');
        } else {
            this.balance.classList.remove('showGreen', 'showRed');
            this.balance.classList.add('showBlack');
        }
    }

    submitExpenseForm() {
        const expenseValue = this.expenseInput.value;
        const amountValue = this.amountInput.value;
        if (expenseValue === '' || amountValue === '' || amountValue < 0) {
            this.expenseFeedback.classList.add('showItem');
            this.expenseFeedback.innerHTML = '<p>Values can\'t be empty or negative</p>'
            const self = this
            setTimeout(function () {
                self.expenseFeedback.classList.remove('showItem');
            }, 4000);
        } else {
            let amount = parseInt(amountValue);
            this.expenseInput.value = '';
            this.amountInput.value = '';

            let expense = {
                id: this.itemID,
                title: expenseValue,
                amount: amount
            };

            this.itemID++;
            this.itemList.push(expense);
            this.addExpense(expense);
            this.showBalance();
        }
    }

    addExpense(expense) {
        const div = document.createElement('div');
        div.classList.add('expense');
        div.innerHTML = `<div class="expense-item d-flex justify-content-between align-items-baseline">
                             <h6 class="expense-title mb-0 text-uppercase list-item">- ${expense.title}</h6>
                             <h5 class="expense-amount mb-0 list-item">${expense.amount}</h5>

                             <div class="expense-icons list-item">
                                 <a href="#" class="edit-icon mx-2" data-id="${expense.id}">
                                    <i class="fas fa-edit"></i>
                                 </a>
                                 <a href="#" class="delete-icon" data-id="${expense.id}">
                                    <i class="fas fa-trash"></i>
                                 </a>
                             </div>
                         </div>`;
        this.expenseList.appendChild(div);
    }

    totalExpense() {
        let total = 0;
        if(this.itemList.length > 0) {
            total = this.itemList.reduce(function (accumulator, current) {
                accumulator += current.amount;
                return accumulator;
            }, 0);
        }
        this.expenseAmount.textContent = total;
        return total
    }

    editExpense(element) {
        let id = parseInt(element.dataset.id);
        let parent = element.parentElement.parentElement.parentElement;
        // remove from the DOM
        this.expenseList.removeChild(parent);

        // remove from the list
        let expense = this.itemList.filter(function (item) {
            return item.id === id;
        })
        // show value
        this.expenseInput.value = expense[0].title;
        this.amountInput.value = expense[0].amount;

        let tempList = this.itemList.filter(function (item) {
            return item.id !== id;
        })
        this.itemList = tempList;
        this.showBalance();
    }

    deleteExpense(element) {
        let id = parseInt(element.dataset.id);
        let parent = element.parentElement.parentElement.parentElement;
        // remove from the DOM
        this.expenseList.removeChild(parent);

        // remove from the list
        let tempList = this.itemList.filter(function (item) {
            return item.id !== id;
        })
        this.itemList = tempList;
        this.showBalance();
    }
}

function eventListenyers() {
    const expenseList = document.getElementById("expense-list");
    const ui = new UI();

    ui.budgetForm.addEventListener('submit', function (event) {
        event.preventDefault();
        ui.submitBudgetForm();
    })

    ui.expenseForm.addEventListener('submit', function (event) {
        event.preventDefault();
        ui.submitExpenseForm();
    })

    expenseList.addEventListener('click', function (event) {
        event.preventDefault();
        if(event.target.parentElement.classList.contains('edit-icon')) {
            ui.editExpense(event.target.parentElement);
        } else if(event.target.parentElement.classList.contains('delete-icon')) {
            ui.deleteExpense(event.target.parentElement);
        }
    })

    return ui;
}

document.addEventListener('DOMContentLoaded', function () {
    let ui = eventListenyers();

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            document.getElementById('save-form').classList.remove('hide');
            document.getElementById('login-form').classList.add('hide');

            let db = firebase.firestore();

            let userId = firebase.auth().currentUser.uid;

            let docRef = db.collection("users").doc(userId);

            docRef.get().then(function(doc) {
                if (doc.exists) {
                    loadData(ui, doc.data());
                } else {
                    // doc.data() will be undefined in this case
                    console.log("No such document!");
                }
            }).catch(function(error) {
                console.log("Error getting document:", error);
            });
        } else {

        }
    });

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    const loginBtn = document.getElementById('login');
    const createAccountBtn = document.getElementById('createAccount');
    const saveBtn = document.getElementById('save');
    const logoutBtn = document.getElementById('logout');

    loginBtn.addEventListener('click', event => {
        event.preventDefault();
        login(emailInput, passwordInput);
    });

    createAccountBtn.addEventListener('click', event => {
        event.preventDefault();
        createAccount(emailInput, passwordInput);
    });

    saveBtn.addEventListener('click', event => {
        event.preventDefault();
        save(ui.budgetAmount.textContent, ui.itemList);
    });

    logoutBtn.addEventListener('click', function (event) {
        event.preventDefault();
        logout();
    });

    document.getElementsByClassName("loader-container")[0].style.display = 'none';
})

function login(emailInput, passwordInput) {

    if (emailInput.value !== '' && passwordInput.value !== '') {

        if(passwordInput.value.length < 6) {
            Swal.fire({
                position: 'top-end',
                type: 'error',
                toast: true,
                title: 'Password must be 6 characters or more',
                showConfirmButton: false,
                timer: 3000
            });
            return
        }

        firebase.auth().signInWithEmailAndPassword(emailInput.value, passwordInput.value).catch(function (error) {
            Swal.fire({
                position: 'top-end',
                type: 'error',
                toast: true,
                title: error.message,
                showConfirmButton: false,
                timer: 3000
            });
        });

    } else {
        if (emailInput.value === '') emailInput.style.border = '2px solid #b80c09';
        if (passwordInput.value === '') passwordInput.style.border = '2px solid #b80c09';
    }
}

function createAccount(emailInput, passwordInput) {

    if (emailInput.value !== '' && passwordInput.value !== '') {

        if (passwordInput.value.length < 6) {
            Swal.fire({
                position: 'top-end',
                type: 'error',
                toast: true,
                title: 'Password must be 6 characters or more',
                showConfirmButton: false,
                timer: 3000
            });
            return
        }

        firebase.auth().createUserWithEmailAndPassword(emailInput.value, passwordInput.value).catch(function(error) {
            Swal.fire({
                position: 'top-end',
                type: 'error',
                toast: true,
                title: error.message,
                showConfirmButton: false,
                timer: 3000
            });
        });
    } else {
        if (emailInput.value === '') emailInput.style.border = '2px solid #b80c09';
        if (passwordInput.value === '') passwordInput.style.border = '2px solid #b80c09';
    }
}

function save(budget, itemList) {

    let string = '';

    for (let i = 0; i < itemList.length; i++) {
        if (i !== itemList.length-1)
            string += JSON.stringify(itemList[i]) + '*';
        else
            string += JSON.stringify(itemList[i]);
    }

    let userId = firebase.auth().currentUser.uid;

    // Add a new document in collection "cities"
    firebase.firestore().collection("users").doc(userId).set({
        budget: budget,
        itemList: string
    })
        .then(function() {
            console.log("Document successfully written!");
            Swal.fire({
                position: 'top-end',
                type: 'success',
                toast: true,
                title: 'Your work has been saved',
                showConfirmButton: false,
                timer: 3000
            })
        })
        .catch(function(error) {
            console.error("Error writing document: ", error);
            Swal.fire({
                position: 'top-end',
                type: 'error',
                toast: true,
                title: 'Your work has not been saved',
                showConfirmButton: false,
                timer: 3000
            })
        });
}

function logout() {
    firebase.auth().signOut().then(function() {
        // Sign-out successful.
        location.reload();
    }).catch(function(error) {
        // An error happened.
        swal("Failed!", error.code, "error");
    });
}

function loadData(ui, data) {

    let budget = parseInt(data.budget);
    let exexpense = data.itemList;

    exexpense = exexpense.split('*');
    let list = [];

    for (let i = 0; i < exexpense.length; i++) {
        list.push(JSON.parse(exexpense[i]));
    }

    ui.budgetAmount.textContent = budget;
    ui.itemID = list.length + 1;

    for (let i = 0; i < list.length; i++) {
        ui.addExpense(list[i]);
    }

    ui.itemList.push(...list);

    ui.showBalance();
}
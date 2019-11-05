class UI {
    constructor() {
        this.budgetForm     = document.getElementById("budget-form");
        this.budgetInput    = document.getElementById("budget-input");
        this.budgetAmount   = document.getElementById("budget-amount");
        this.expenseAmount  = document.getElementById("expense-amount");
        this.balance        = document.getElementById("balance");
        this.balanceAmount  = document.getElementById("balance-amount");
        this.expenseForm    = document.getElementById("expense-form");
        this.expenseInput   = document.getElementById("expense-input");
        this.amountInput    = document.getElementById("amount-input");
        this.expenseList    = document.getElementById("expense-list");
        this.model_id       = document.getElementById('expense_id');
        this.model_title    = document.getElementById('title');
        this.model_value    = document.getElementById('value');
        this.edit_button    = document.getElementById('edit');
        this.delete_button  = document.getElementById('delete');
        this.element        = null;
        this.budget         = 0;
        this.expenses       = 0;
        this.itemList       = [];
        this.itemID         = 0;
    }

    save() {
        let string = '';

        for (let i = 0; i < this.itemList.length; i++) {
            if (i !== this.itemList.length - 1)
                string += JSON.stringify(this.itemList[i]) + '*';
            else
                string += JSON.stringify(this.itemList[i]);
        }

        let userId = firebase.auth().currentUser.uid;

        // Add a new document in collection "cities"
        firebase.firestore().collection("users").doc(userId).set({
            budget: this.budget,
            itemList: string
        })
        .then(function () {
            Swal.fire({
                position: 'top-end',
                type: 'success',
                toast: true,
                title: 'Your work has been saved',
                showConfirmButton: false,
                timer: 3000
            })
        })
        .catch(function (error) {
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

    submitBudgetForm() {
        const value = this.budgetInput.value;
        if (value === '' || value < 0) {
            this.budgetInput.classList.add('is-invalid');
        } else {
            this.budgetAmount.textContent = value;
            this.budgetInput.value = '';
            this.budget = value;
            this.showBalance();
            this.save();
        }
    }

    showBalance() {
        const expense = this.totalExpense();
        const total = parseInt(this.budgetAmount.textContent) - expense;
        this.balanceAmount.textContent = total;
        if (total < 0) {
            this.balance.classList.remove('text-success', 'text-dark');
            this.balance.classList.add('text-danger');
        } else if (total > 0) {
            this.balance.classList.remove('text-dark', 'text-danger');
            this.balance.classList.add('text-success');
        } else {
            this.balance.classList.remove('text-success', 'text-danger');
            this.balance.classList.add('text-dark');
        }
    }

    submitExpenseForm() {
        const expenseValue = this.expenseInput.value;
        const amountValue = this.amountInput.value;
        let flag = true;

        if (expenseValue === '') {
            this.expenseInput.classList.add('is-invalid');
            flag = false;
        }

        if (amountValue === '' || amountValue < 0) {
            this.amountInput.classList.add('is-invalid');
            flag = false;
        }

        if (flag) {
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
            this.save();
        }
    }

    addExpense(expense) {
        const div = document.createElement('tr');

        div.innerHTML = `
    <td>
        ${expense.title}
    </td>
    <td>$ ${expense.amount}</td>
    <td>
        <a href="#" role="button" class="edit-icon btn btn-success" data-id="${expense.id}">
            <i class="fas fa-pen"></i>
        </a>
        <a href="#" role="button" class="delete-icon btn btn-danger" data-id="${expense.id}">
            <i class="far fa-trash-alt"></i>
        </a>
    </td>
        `;
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
        this.expenseAmount.textContent = ''+total;
        return total;
    }

    showEditModel(element) {
        let id = parseInt(element.dataset.id);

        let expense = this.itemList.filter(function (item) {
            return item.id === id;
        });

        this.model_id.value = expense[0].id;
        this.model_title.value = expense[0].title;
        this.model_value.value = expense[0].amount;

        this.element = element;

        $('#edit_modal').modal('show');
    }

    editExpense() {
        let parent = this.element.parentElement.parentElement;

        // Edit values in DOM
        parent.children[0].innerText = this.model_title.value;
        parent.children[1].innerText = '$' + this.model_value.value;

        // Edit values in list
        let index = this.itemList.findIndex((item => item.id === parseInt(this.model_id.value)));
        this.itemList[index].title = this.model_title.value;
        this.itemList[index].amount = parseInt(this.model_value.value);
        this.element = null;

        this.showBalance();
        this.save();
        $('#edit_modal').modal('hide');
    }

    deleteExpense(element) {
        if (element == null) {
            element = this.element;
        }

        let id = parseInt(element.dataset.id);
        let parent = element.parentElement.parentElement;

        // remove from the DOM
        this.expenseList.removeChild(parent);

        // remove from the list
        this.itemList = this.itemList.filter(function (item) {
            return item.id !== id;
        });

        this.showBalance();
        this.save();
        $('#edit_modal').modal('hide');
    }
}

function eventListeners() {
    const expenseList = document.getElementById("expense-list");
    const ui = new UI();

    $('#edit_modal').on('shown.bs.modal', () => {
        $('#title').focus();
    });

    ui.delete_button.addEventListener('click', () => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.value) {
                ui.deleteExpense(null);
            }
        });
    });

    ui.edit_button.addEventListener('click', () => {
        ui.editExpense();
    });

    ui.budgetForm.addEventListener('submit', function (event) {
        event.preventDefault();
        ui.submitBudgetForm();
    });

    ui.expenseForm.addEventListener('submit', function (event) {
        event.preventDefault();
        ui.submitExpenseForm();
    });

    expenseList.addEventListener('click', function (event) {
        event.preventDefault();
        if(event.target.classList.contains('edit-icon')) {
            ui.showEditModel(event.target);
        } else if(event.target.classList.contains('delete-icon')) {
            Swal.fire({
                title: 'Are you sure?',
                text: "You won't be able to revert this!",
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete it!'
            }).then((result) => {
                if (result.value) {
                    ui.deleteExpense(event.target);
                }
            });
        } else if(event.target.classList.contains('fa-trash-alt')) {
            Swal.fire({
                title: 'Are you sure?',
                text: "You won't be able to revert this!",
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete it!'
            }).then((result) => {
                if (result.value) {
                    ui.deleteExpense(event.target.parentElement);
                }
            });
        } else if(event.target.classList.contains('fa-pen')) {
            ui.showEditModel(event.target.parentElement);
        }
    });

    return ui;
}

document.addEventListener('DOMContentLoaded', function () {
    let ui = eventListeners();

    let toggler = document.getElementById("toggler");
    let menu = document.getElementById("menu");
    toggler.addEventListener('click', () => {
        menu.classList.toggle("fa-ellipsis-v");
        menu.classList.toggle("fa-times");
    });

    ui.budgetInput.addEventListener('input', () => {
        ui.budgetInput.classList.remove('is-invalid');
    });

    ui.expenseInput.addEventListener('input', () => {
        ui.expenseInput.classList.remove('is-invalid');
    });

    ui.amountInput.addEventListener('input', () => {
        ui.amountInput.classList.remove('is-invalid');
    });

    window.addEventListener('scroll', () => {
        let top = document.querySelector('#top');
        if (window.scrollY < 150) {
            top.classList.remove('show');
        } else {
            top.classList.add('show');
        }
    });

    $('a[href^="#"]').on('click', function (event) {
        let target = $(this.getAttribute('href'));
        if(target.length) {
            event.preventDefault();
            $('html, body').stop().animate({
                scrollTop: target.offset().top
            }, 500);
        }
    });

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            document.getElementById('user_logged').classList.remove('d-none');
            document.getElementById('user_not_logged').classList.add('d-none');

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
            document.getElementById('user_logged').classList.add('d-none');
            document.getElementById('user_not_logged').classList.remove('d-none');
        }
    });

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    emailInput.addEventListener('input', () => {
        emailInput.classList.remove('is-invalid');
    });

    passwordInput.addEventListener('input', () => {
        passwordInput.classList.remove('is-invalid');
    });

    const loginBtn = document.getElementById('login');
    const createAccountBtn = document.getElementById('createAccount');
    const logoutBtn = document.getElementById('logout');

    loginBtn.addEventListener('click', event => {
        event.preventDefault();
        login(emailInput, passwordInput);
    });

    createAccountBtn.addEventListener('click', event => {
        event.preventDefault();
        createAccount(emailInput, passwordInput);
    });

    logoutBtn.addEventListener('click', function (event) {
        event.preventDefault();
        logout();
    });
});

function login(emailInput, passwordInput) {

    if (emailInput.value !== '' && passwordInput.value !== '') {

        if(passwordInput.value.length < 6) {
            passwordInput.classList.add('is-invalid');
            return
        }

        document.getElementById('close').click();

        firebase.auth().signInWithEmailAndPassword(emailInput.value, passwordInput.value).catch(function (error) {
            Swal.fire({
                position: 'top-end',
                type: 'error',
                toast: true,
                title: error.message,
                showConfirmButton: false,
                timer: 7000
            });
        });

    } else {
        if (emailInput.value === '') emailInput.classList.add('is-invalid');
        if (passwordInput.value === '') passwordInput.classList.add('is-invalid');
    }
}

function createAccount(emailInput, passwordInput) {

    if (emailInput.value !== '' && passwordInput.value !== '') {

        if (passwordInput.value.length < 6) {
            passwordInput.classList.add('is-invalid');
            return
        }

        document.getElementById('close').click();

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
        if (emailInput.value === '') emailInput.classList.add('is-invalid');
        if (passwordInput.value === '') passwordInput.classList.add('is-invalid');
    }
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
    console.log(budget);
    let expenses = data.itemList;

    // let a = new Intl.NumberFormat('arab', { style: 'currency', currency: 'USD' }).format(50000000000000);

    ui.budgetAmount.innerText = parseInt(ui.budgetAmount.innerText) + budget;

    if (expenses !== '') {
        expenses = expenses.split('*');
        let list = [];

        for (let i = 0; i < expenses.length; i++) {
            list.push(JSON.parse(expenses[i]));
        }

        ui.itemID = list.length + 1;

        for (let i = 0; i < list.length; i++) {
            ui.addExpense(list[i]);
        }

        ui.itemList.push(...list);
    }

    ui.showBalance();

    let loader = document.getElementsByClassName('loader');

    for (let i = 0; i < loader.length; i++) {
        loader[i].classList.add('d-none');
        loader[i].classList.remove('d-flex');
    }

    document.getElementById('budget').classList.remove('d-none');
    document.getElementById('expense').classList.remove('d-none');
    document.getElementById('balance').classList.remove('d-none');
}

/* TODO Format Money using Intl.NumberFormat

 */

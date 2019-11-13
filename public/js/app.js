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
        this.select_option = document.getElementById('currency');
        this.element        = null;
        this.budget         = 0;
        this.itemList       = [];
        this.itemID         = 0;
        this.currency       = '$';
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

        // Add a new document in collection "users"
        firebase.firestore().collection("users").doc(userId).set({
            budget: this.budget,
            itemList: string,
            currency: this.currency
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
            this.budgetAmount.innerText = this.formatNumber(value);
            this.budgetInput.value = '';
            this.budget = value;
            this.showBalance();
            this.save();
        }
    }

    formatNumber(number) {
        return new Intl.NumberFormat().format(number);
    }

    showBalance() {
        const expense = this.totalExpense();
        const total   = this.budget - expense;
        this.balanceAmount.textContent = this.formatNumber(total);
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
                amount: amount,
                isCompleted: false
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
        let amount = this.formatNumber(expense.amount);

        let icon = 'fa-circle';
        let checked = '';
        if (expense.isCompleted) {
            icon = 'fa-check-circle text-success';
            checked = 'checked';
        }

        div.innerHTML = `
            <td class="align-middle">
                <button class="btn btn-lg complete-icon" data-id="${expense.id}">
                    <i class="far ${icon}"></i>
                </button>
            </td>
            <td class="align-middle ${checked}">
                ${expense.title}
            </td>
            <td class="align-middle ${checked}">
                ${this.currency}${amount}
            </td>
            <td class="align-middle">
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

    completeExpense(element) {
        let id = parseInt(element.dataset.id);
        let parent = element.parentElement.parentElement.children;
        let index = this.itemList.findIndex((item => item.id === id));

        // Edit values in list
        let checked = this.itemList[index].isCompleted = !this.itemList[index].isCompleted;

        // Edit icon in DOM
        if (checked) {
            parent[1].classList.add('checked');
            parent[2].classList.add('checked');
            element.children[0].classList.remove('fa-circle');
            element.children[0].classList.add('fa-check-circle', 'text-success');
        } else {
            parent[1].classList.remove('checked');
            parent[2].classList.remove('checked');
            element.children[0].classList.remove('fa-check-circle', 'text-success');
            element.children[0].classList.add('fa-circle');
        }

        this.save();
    }

    totalExpense() {
        let total = 0;
        if(this.itemList.length > 0) {
            total = this.itemList.reduce(function (accumulator, current) {
                accumulator += current.amount;
                return accumulator;
            }, 0);
            this.expenseAmount.innerText = this.formatNumber(total);
        }
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
        element.parentElement.parentElement.classList.add('table-success');

        $('#edit_modal').modal('show');
    }

    editExpense() {
        let parent = this.element.parentElement.parentElement;

        // Edit values in DOM
        parent.children[1].innerText = this.model_title.value;
        parent.children[2].innerText = this.currency + this.formatNumber(this.model_value.value);

        // Edit values in list
        let index = this.itemList.findIndex((item => item.id === parseInt(this.model_id.value)));
        this.itemList[index].title = this.model_title.value;
        this.itemList[index].amount = parseInt(this.model_value.value);

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

    $('#edit_modal').on('hidden.bs.modal', (e) => {
        ui.element.parentElement.parentElement.classList.remove('table-success');
        ui.element = null;
    });

    ui.select_option.addEventListener('change', (e) => {

        let children = ui.expenseList.children;
        for (let i = 0; i < children.length; i++) {
            let child = children[i].children[2];
            let child_text = child.innerText;
            child.innerText = child_text.replace(ui.currency, e.target.value);
        }
        ui.currency = e.target.value;
        ui.save();
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
        } else if(event.target.classList.contains('complete-icon')) {
            ui.completeExpense(event.target);
        } else if(event.target.classList.contains('fa-check-circle') ||
                  event.target.classList.contains('fa-circle')) {
            ui.completeExpense(event.target.parentElement);
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

    ui.budget += parseInt(data.budget);
    ui.currency = data.currency;
    let expenses = data.itemList;

    let options = ui.select_option.options;
    for (let i = 0; i < options.length; i++) {
        if (ui.currency === options[i].value) {
            ui.select_option.selectedIndex = i;
        }
    }

    ui.select_option.classList.remove('d-none');

    ui.budgetAmount.innerText = ui.formatNumber(ui.budget);

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

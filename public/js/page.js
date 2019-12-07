import Firebase from "./firebase.js";
import App from "./app.js";

export default class Page {
    constructor() {
        // Loaders
        this.pageLoader    = document.getElementById("page_loader");
        this.allLoaders    = document.querySelectorAll('.loader');
        this.hiddenElement = document.querySelectorAll('.d-none');

        // Info
        this.currencyOption = document.getElementById("currency_option");
        this.expenseAmount  = document.getElementById("expense_amount");
        this.budgetAmount   = document.getElementById("budget_amount");
        this.balanceAmount  = document.getElementById("balance_amount");
        this.currencyFiled  = document.querySelectorAll(".currency");

        // Expenses
        this.expenses      = document.getElementById("expenses_list");
        this.totalExpenses = document.getElementById("total");
        this.deleteAll     = document.getElementById("delete_all");
        this.completeAll   = document.getElementById("complete_all");

        // Expense Modal
        this.expenseTitle  = document.getElementById("expense_title");
        this.expenseValue  = document.getElementById("expense_value");
        this.expenseButton = document.getElementById("expense_button");

        // Budget Modal
        this.budgetValue  = document.getElementById("budget_value");
        this.budgetButton = document.getElementById("budget_button");

        // Account Modal
        this.login    = document.getElementById("login");
        this.logout   = document.getElementById("logout");
        this.register = document.getElementById("register");
        this.email    = document.getElementById("email");
        this.password = document.getElementById("password");

        // App
        this.app      = new App(this);
        this.firebase = new Firebase(this);
        this.element  = null;
        this.budget   = 0;
        this.items    = [];
        this.currency = '$';
        this.success  = 'Your work has been saved';
        this.failed   = 'Your work has not been saved';
    }

    init() {
        $('#login_modal').on('shown.bs.modal', () => {
            $('#email').focus();
        });
        this.firebase.auth();
        this.login.addEventListener('click', () => {
            this.firebase.login(this.email, this.password);
        });
        this.register.addEventListener('click', () => {
            this.firebase.register(this.email, this.password);
        });
        let allInputs = document.querySelectorAll('input');
        for (let i = 0; i < allInputs.length; i++) {
            allInputs[i].addEventListener('input', (e) => {
                e.target.classList.remove('is-invalid');
            });
        }
    }

    removeLoaders() {
        for (let i = 0; i < this.allLoaders.length; i++) {
            this.allLoaders[i].remove();
        }

        for (let i = 0; i < this.hiddenElement.length; i++) {
            this.hiddenElement[i].classList.remove('d-none');
        }
    }

    message(type, massage) {
        Swal.fire({
            position: 'top-start',
            type: type,
            toast: true,
            title: massage,
            showConfirmButton: false,
            timer: 5000
        })
    }

    async confirmMassage() {
        return await Swal.fire({
            title: 'Are you sure you want to delete all your expenses ?',
            text: "You won't be able to revert this!",
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });
    }

    eventListeners() {
        this.logout.addEventListener('click', () => {
            this.firebase.logout();
        });

        this.budgetButton.addEventListener('click', () => {
            this.app.updateBudget();
        });

        this.expenseButton.addEventListener('click', () => {
            this.app.expenseValidation(this.element);
        });
        let expense_modal = $('#expense_modal');
        $(expense_modal).on('shown.bs.modal', e => {
            let id = e.relatedTarget.dataset.id;
            if (id !== undefined) {
                let i                   = this.items.findIndex((item => item.id === id));
                this.expenseTitle.value = this.items[i].title;
                this.expenseValue.value = this.items[i].amount;
                this.element            = e.relatedTarget.parentElement.parentElement;
            }
            $('#expense_title').focus();
        });

        $(expense_modal).on('hidden.bs.modal', e => {
            this.element = null;
            $('#expense_title').val('');
            $('#expense_value').val('');
        });

        $('#budget_modal').on('shown.bs.modal', () => {
            this.budgetValue.focus();
            this.budgetValue.value = this.budget;
        });
        this.deleteAll.addEventListener('click', () => {
            this.confirmMassage().then((result) => {
                if (result.value) {
                    this.app.deleteAllExpense();
                }
            });
        });
        this.completeAll.addEventListener('click', (e) => {
            this.app.completeAllExpense(e.target.dataset.status);
        });
        this.currencyOption.addEventListener('change', (e) => {
            this.app.changeCurrency(e.target.value);
        });

        this.expenses.addEventListener('click', e => {
            e.preventDefault();

            let target    = e.target;
            let className = target.classList;

            if (className.contains('delete-icon')) {
                this.confirmMassage().then((result) => {
                    if (result.value) {
                        this.app.deleteExpense(target);
                    }
                });
            } else if (className.contains('fa-trash-alt')) {
                this.confirmMassage().then((result) => {
                    if (result.value) {
                        this.app.deleteExpense(target.parentElement);
                    }
                });
            } else if (className.contains('complete-icon')) {
                this.app.completeExpense(target);
            }
        });
    }
}
export default class App {
    constructor(page) {
        this.page = page;
    }

    generateID() {
        return Math.random().toString(36).substr(2, 9);
    }

    save() {
        let string = '';

        for (let i = 0; i < this.page.items.length; i++) {
            if (i !== this.page.items.length - 1)
                string += JSON.stringify(this.page.items[i]) + '*';
            else
                string += JSON.stringify(this.page.items[i]);
        }

        let userId = firebase.auth().currentUser.uid;
        let self   = this;
        firebase.firestore().collection("users").doc(userId).set({
            budget: self.page.budget,
            itemList: string,
            currency: self.page.currency
        })
                .then(function () {
                    self.page.message('success', self.page.success);
                })
                .catch(function (error) {
                    console.error("Error writing document: ", error);
                    self.page.message('error', self.page.failed);
                });
    }

    updateBudget() {
        let value = this.page.budgetValue.value;
        if (value === '' || value < 0) {
            this.page.budgetValue.classList.add('is-invalid');
        } else {
            this.page.budgetAmount.innerText = this.formatNumber(value);
            this.page.budgetValue.value      = '';
            this.page.budget                 = value;
            $('#budget_modal').modal('hide');
            this.showBalance();
            this.save();
        }
    }

    formatNumber(number) {
        return new Intl.NumberFormat().format(number);
    }

    showBalance() {
        let expense                       = this.totalExpense();
        let total                         = this.page.budget - expense;
        this.page.balanceAmount.innerText = this.formatNumber(total);

        let classAdd, classRemove;

        if (total < 0) {
            classAdd    = 'text-danger';
            classRemove = ['text-success', 'text-dark'];
        } else if (total > 0) {
            classAdd    = 'text-success';
            classRemove = ['text-dark', 'text-danger'];
        } else {
            classAdd    = 'text-dark';
            classRemove = ['text-success', 'text-danger'];
        }

        this.page.balanceAmount.classList.remove(classRemove[0], classRemove[1]);
        this.page.balanceAmount.classList.add(classAdd);
        this.page.balanceAmount.parentElement.children[0].classList.remove(classRemove[0], classRemove[1]);
        this.page.balanceAmount.parentElement.children[0].classList.add(classAdd);

        this.page.totalExpenses.innerText = '' + this.page.items.length;

        if (this.page.items.length === 0) {
            this.page.deleteAll.classList.add('d-none');
            this.page.completeAll.classList.add('d-none');
        } else {
            this.page.deleteAll.classList.remove('d-none');
            this.page.completeAll.classList.remove('d-none');

            let new_list = this.page.items.filter(item => {
                return item.isCompleted;
            });

            if (new_list.length === this.page.items.length) {
                this.page.completeAll.innerHTML      = '<i class="fas fa-times"></i> Incomplete All';
                this.page.completeAll.dataset.status = 'false';
                this.page.completeAll.classList.remove('btn-success');
                this.page.completeAll.classList.add('btn-warning');
            } else {
                this.page.completeAll.innerHTML      = '<i class="fas fa-check-double"></i> Complete All';
                this.page.completeAll.dataset.status = 'true';
                this.page.completeAll.classList.add('btn-success');
                this.page.completeAll.classList.remove('btn-warning');
            }
        }
    }

    expenseValidation(element) {
        let title = this.page.expenseTitle.value;
        let value = this.page.expenseValue.value;
        let flag  = true;

        if (title === '') {
            this.page.expenseTitle.classList.add('is-invalid');
            flag = false;
        }

        if (value === '' || value < 0) {
            this.page.expenseValue.classList.add('is-invalid');
            flag = false;
        }

        if (flag) {
            this.page.expenseTitle.value = '';
            this.page.expenseValue.value = '';

            if (element !== null) {
                let id                    = element.dataset.id;
                let children              = element.children;
                children[1].innerText     = title;
                children[2].innerText     = this.page.currency + this.formatNumber(value);
                let i                     = this.page.items.findIndex((item => item.id === id));
                this.page.items[i].title  = title;
                this.page.items[i].amount = parseInt(value);
            } else {
                let expense = {
                    id: this.generateID(),
                    title: title,
                    amount: parseInt(value),
                    isCompleted: false
                };
                this.page.items.push(expense);
                this.addExpense(expense);
            }
            this.showBalance();
            this.save();
            $('#expense_modal').modal('hide');
        }
    }

    addExpense(expense) {
        let div        = document.createElement('tr');
        div.dataset.id = expense.id;
        let amount     = this.formatNumber(expense.amount);

        let checked = '';
        let icon    = 'far fa-square';
        if (expense.isCompleted) {
            checked = 'checked';
            icon    = 'fas fa-check-square text-success';
            div.classList.add('table-primary');
        }

        div.innerHTML = `
            <td class="align-middle">
                <i class="${icon} complete-icon" style="transform: scale(1.5)" data-checked="${expense.isCompleted}" data-id="${expense.id}"></i>
            </td>
            <td class="align-middle ${checked}">
                ${expense.title}
            </td>
            <td class="align-middle ${checked}">
                ${this.page.currency} ${amount}
            </td>
            <td class="align-middle">
                <a href="#" role="button" class="btn btn-success rounded animate action-button shadow mx-1 my-1" data-id="${expense.id}" data-toggle="modal" data-target="#expense_modal">
                    <i class="fas fa-pen"></i>
                </a>
                <a href="#" role="button" class="delete-icon btn btn-danger rounded animate action-button shadow mx-1 my-1" data-id="${expense.id}">
                    <i class="far fa-trash-alt"></i>
                </a>
            </td>
        `;
        this.page.expenses.appendChild(div);
    }

    completeExpense(element) {
        let id       = element.dataset.id;
        let checked  = element.dataset.checked === 'true' ? 'false' : 'true';
        let parent   = element.parentElement.parentElement;
        let children = parent.children;
        let index    = this.page.items.findIndex((item => item.id === id));

        // Edit values in list and DOM
        element.dataset.checked            = checked;
        this.page.items[index].isCompleted = checked === 'true';

        if (checked === 'true') {
            element.classList.remove('far', 'fa-square');
            element.classList.add('fas', 'fa-check-square', 'text-success');
            parent.classList.add('table-primary');
            children[1].classList.add('checked');
            children[2].classList.add('checked');
        } else {
            element.classList.add('far', 'fa-square');
            element.classList.remove('fas', 'fa-check-square', 'text-success');
            parent.classList.remove('table-primary');
            children[1].classList.remove('checked');
            children[2].classList.remove('checked');
        }

        this.showBalance();
        this.save();
    }

    totalExpense() {
        let total = 0;
        if (this.page.items.length > 0) {
            total = this.page.items.reduce(function (accumulator, current) {
                accumulator += current.amount;
                return accumulator;
            }, 0);
        }
        this.page.expenseAmount.innerText = this.formatNumber(total);
        return total;
    }

    deleteExpense(element) {
        let id     = element.dataset.id;
        let parent = element.parentElement.parentElement;

        // remove from the DOM
        this.page.expenses.removeChild(parent);

        // remove from the list
        this.page.items = this.page.items.filter((item) => {
            return item.id !== id;
        });

        this.showBalance();
        this.save();
    }

    changeCurrency(currency) {
        let children = this.page.expenses.children;

        for (let i = 0; i < children.length; i++) {
            let child       = children[i].children[2];
            child.innerText = child.innerText.replace(this.page.currency, currency);
        }
        this.page.currency = currency;
        for (let i = 0; i < this.page.currencyFiled.length; i++) {
            this.page.currencyFiled[i].innerText = currency;
        }
        this.save();
    }

    deleteAllExpense() {
        this.page.items              = [];
        this.page.expenses.innerHTML = '';
        this.showBalance();
        this.save();
    }

    completeAllExpense(status) {
        this.page.expenses.innerHTML = '';
        let check                    = status === 'true';

        for (let i = 0; i < this.page.items.length; i++) {
            this.page.items[i].isCompleted = check;
            this.addExpense(this.page.items[i]);
        }

        this.showBalance();
        this.save();
    }

    loadData(data) {
        this.page.budget   = parseInt(data.budget);
        this.page.currency = data.currency;
        let expenses       = data.itemList;

        let options = this.page.currencyOption.options;
        for (let i = 0; i < options.length; i++) {
            if (this.page.currency === options[i].value) {
                this.page.currencyOption.selectedIndex = i;
            }
        }

        this.page.budgetAmount.innerText = this.formatNumber(this.page.budget);

        for (let i = 0; i < this.page.currencyFiled.length; i++) {
            this.page.currencyFiled[i].innerText = this.page.currency;
        }

        if (expenses !== '') {
            expenses = expenses.split('*');
            let list = [];

            for (let i = 0; i < expenses.length; i++) {
                list.push(JSON.parse(expenses[i]));
            }

            for (let i = 0; i < list.length; i++) {
                this.addExpense(list[i]);
            }

            this.page.items = list;
        }

        this.page.removeLoaders();
        this.showBalance();
    }
}

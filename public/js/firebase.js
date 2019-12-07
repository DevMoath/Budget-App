export default class Firebase {
    constructor(page) {
        this.page = page;
    }

    auth() {
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                $('#login_modal').modal('hide');
                this.page.eventListeners();
                this.page.pageLoader.remove();

                let database = firebase.firestore();
                let userId   = firebase.auth().currentUser.uid;
                let docRef   = database.collection("users").doc(userId);
                let self     = this;

                docRef.get().then((doc) => {
                    if (doc.exists) {
                        self.page.app.loadData(doc.data());
                    } else {
                        self.page.removeLoaders();
                        self.page.app.showBalance();
                    }
                }).catch(function (error) {
                    console.error("Error getting document:", error);
                    self.page.message('error', self.page.failed);
                });
            } else {
                $('#login_modal').modal({
                    backdrop: 'static',
                    keyboard: false
                });
            }
        });
    }

    accountValidation(emailInput, passwordInput) {
        let flag = true;
        if (emailInput.value === '') {
            emailInput.classList.add('is-invalid');
            flag = false;
        }
        if (passwordInput.value === '' || passwordInput.value.length < 6) {
            passwordInput.classList.add('is-invalid');
            flag = false;
        }
        return flag;
    }

    login(emailInput, passwordInput) {
        if (this.accountValidation(emailInput, passwordInput)) {
            let self = this;
            firebase.auth().signInWithEmailAndPassword(emailInput.value, passwordInput.value)
                    .catch((error) => {
                        self.page.message('error', error.message);
                    });
        }
    }

    register(emailInput, passwordInput) {
        if (this.accountValidation(emailInput, passwordInput)) {
            firebase.auth().createUserWithEmailAndPassword(emailInput.value, passwordInput.value)
                    .catch(error => {
                        self.page.message('error', error.message);
                    });
        }
    }

    logout() {
        let self = this;
        firebase.auth().signOut().then(() => {
            location.reload();
        }).catch(error => {
            self.page.message('error', error.message);
        });
    }
}
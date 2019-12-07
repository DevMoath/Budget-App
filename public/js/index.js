// Disable zoom feature in mobile browsers
import Page from "./page.js";

document.addEventListener('gesturestart', e => {
    e.preventDefault();
});

document.addEventListener('DOMContentLoaded', () => {
    new Page().init();
});
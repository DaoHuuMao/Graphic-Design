const pages = ['page1', 'page2', 'page3', 'page4', 'page5', 'page6'];
const container = document.getElementById('app');

function loadPage(page) {
    import(`./src/pages/${page}.js`).then((module) => {
        container.innerHTML = '';
        module.init(container);
    });
}

document.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        const page = event.target.dataset.page;
        loadPage(page);
    });
});
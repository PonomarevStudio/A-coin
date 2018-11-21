export default class Presentation {
    constructor(parameters = {}) {
        this.parameters = parameters;
        this.TerminalApp = parameters.TerminalApp;
        this.data = {};
        this.slides = {};
    }

    async preloadSlides() {
        return Promise.all(Object.values(this.slides).map(this.slideLoader.bind(this)));
    }

    async slideLoader(slide) {
        const htmlPath = this.TerminalApp.parameters.htmlPath + slide.html + '.html';
        const response = await fetch(htmlPath);
        return slide.source = await response.text();
    }

    async init(slide = null, historyPush = true) {
        delete this.TerminalApp.currentAction;
        return await this.slide(slide || this.data.entrySlide, void (0), historyPush);
    }

    async slide(id, emptyBody = true, historyPush = true) {

        if (this.TerminalApp.changingSlide) return await false;

        this.TerminalApp.changingSlide = true;

        if (!this.slides[id]) {
            delete this.TerminalApp.changingSlide;
            throw new Error(`Slide ${id} not exist!`);
        }

        await this.TerminalApp.unloadPage(emptyBody);

        this.TerminalApp.currentPresentation = this;

        const slide = this.slides[id];

        this.TerminalApp.currentSlide = slide;

        this.TerminalApp.currentSlideId = id;

        if (historyPush && (!history.state || history.state.slide !== slide || history.state.presentation !== this.data.id))
            history.pushState({slide: id, presentation: this.data.id}, this.data.title, `?${this.data.id}#${id}`);

        if (slide.source) this.TerminalApp.root.innerHTML = slide.source;

        setTimeout(() => this.TerminalApp.inAction = false, 1000);

        this.TerminalApp.inAction = false;

        document.body.querySelectorAll('[data-bind]').forEach(element => {
            this.data[element.dataset.bind] ? element.innerHTML = this.data[element.dataset.bind] : null
        });

        if (slide.init) return await slide.init().finally((result) => {
            delete this.TerminalApp.changingSlide;
            this.TerminalApp.inAction = false;
            return result;
        });

        this.TerminalApp.inAction = false;
        return delete this.TerminalApp.changingSlide;

    }

    sleep(timeout) {
        return new Promise(resolve => setTimeout(resolve, timeout));
    }

    async prepareAction() {
        if (this.TerminalApp.inAction) throw new Error();
        this.TerminalApp.inAction = true;
        return await true;
    }

    async bindAction(target, action, triggerTimeout = false) {
        // console.log('Bind action for', selector);
        const targetNode = target instanceof Node ? target : document.querySelector(target);
        const actionWorker = async () => {
            // console.log('Triggered action from', selector);
            // console.log(this.TerminalApp.changingSlide, this.TerminalApp.currentAction, this.TerminalApp.currentSlideId);
            if (this.TerminalApp.changingSlide || this.TerminalApp.currentAction === this.TerminalApp.currentSlideId) return await false;
            this.TerminalApp.currentAction = this.TerminalApp.currentSlideId;
            clearTimeout(this.TerminalApp.actionTimeout);
            // console.log('Check passed, executing action...');
            return await action();
        };
        await targetNode.addEventListener('click', actionWorker);
        if (this.TerminalApp.parameters.autoplay && triggerTimeout) this.TerminalApp.actionTimeout = setTimeout(actionWorker, triggerTimeout);
    }

    animateValueDelay(id, start, end, duration, delay) {
        return setTimeout(function () {
            this.animateValue(id, start, end, duration)
        }.bind(this), delay);
    }

    animateValue(id, start, end, duration) {
        var range = end - start;
        var current = start;
        var increment = end > start ? 1 : -1;
        var stepTime = Math.abs(Math.floor(duration / range));
        var obj = document.querySelector(id);
        var timer = setInterval(function () {
            current += increment;
            obj.innerHTML = current;
            if (current == end) {
                clearInterval(timer);
            }
        }, stepTime);
    }

}
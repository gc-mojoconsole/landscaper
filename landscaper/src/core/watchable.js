export default class Watchable {
    watcher = []

    mountWatcher(cb_setstate){
        this.watcher.push(cb_setstate);
    }

    unmountWatcher(cb_setstate){
        let index = this.watcher.indexOf(cb_setstate);
        this.watcher.splice(index, 1);
    }

    onUpdate() {
        this.watcher.forEach(cb_setstate => {
            cb_setstate({});
        });
    }
}
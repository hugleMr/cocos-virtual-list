const { ccclass, property } = cc._decorator;
/**
 * Single rendering base T data structure
 * @author slf
 *  */
@ccclass
export default class AItemRenderer<T> extends cc.Component {
    @property({ displayName: "Whether to add a click event" })
    isClick: boolean = false;

    protected callback: Function; //Callback
    protected cbThis: any; //Return

    private _data: T; //data structure
    public get data(): T {
        return this._data;
    }
    public set data(v: T) {
        this._data = v;
        this.dataChanged();
    }

    /**Data changes subclass rewriting*/
    protected dataChanged(): void {}

    /**Refresh data */
    public refreshData(): void {
        this.dataChanged();
    }

    /**destroy */
    public onDestroy(): void {
        this._data = null;
    }

    /**
     * Set click to call back
     * @param cb Callback
     * @param cbT Return
     */
    public setTouchCallback(cb?: Function, cbT?: any): void {
        this.callback = cb;
        this.cbThis = cbT;
        if (this.node) {
            if (this.node.hasEventListener(cc.Node.EventType.TOUCH_END)) {
                this.node.off(
                    cc.Node.EventType.TOUCH_END,
                    this.onClickCallback,
                    this
                );
            }
            this.node.on(
                cc.Node.EventType.TOUCH_END,
                this.onClickCallback,
                this
            );
        }
    }

    /**
     * The prefabricated clicks will carry DATA
     * @param e
     */
    protected onClickCallback(e: cc.Event): void {
        this.callback && this.callback.call(this.cbThis, this.data);
    }
}

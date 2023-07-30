import AItemRenderer from "./AItemRenerer";

const { ccclass, property } = cc._decorator;

/**
 * Virtual rolling view expansion CC.ScrollView
 * Rendering prefabricated body must mount AITEMRENDERER subclasses
 * @author slf
 */
@ccclass
export default class AVirtualScrollView extends cc.ScrollView {
    /**Rendering prefabricated body must mount Aitemrenderer subclass */
    @property({
        type: cc.Prefab,
        serializable: true,
        displayName: "Rendering prefabrication",
    })
    itemRenderer: cc.Prefab = null;

    /**Sub -clicks to callback function back adjustment scope*/
    protected callback: Function;
    protected cbThis: any;

    /**Maximum rendering vertical quantity */
    private verticalCount: number;
    /**Maximum rendering level level level */
    private horizontalCount: number;
    /**Prefabricated body width */
    private itemW: number;
    private itemH: number;
    /**Timer */
    private interval: number;
    /**Prefabrication */
    private itemPool: any[];
    /**Prefabrication list */
    private itemList: any[];
    /**List of prefabrication rendering */
    private itemRendererList: any[];
    /**Datasheets */
    private dataList: any[];
    /**Start coordinate */
    private startPos: cc.Vec2;
    /**layout*/
    private contentLayout: cc.Layout;

    /**Forcibly refresh */
    private forcedRefresh: boolean;
    /**Refresh */
    private refresh: boolean;

    protected onLoad(): void {
        this.itemList = [];
        this.itemPool = [];
        this.itemRendererList = [];
        this.contentLayout = this.content.getComponent(cc.Layout);
        this.contentLayout.enabled = false;

        //starting point
        let itemNode: cc.Node = this.itemRenderer.data;
        this.startPos = new cc.Vec2(
            itemNode.width * itemNode.anchorX + this.contentLayout.paddingLeft,
            -(
                itemNode.height * itemNode.anchorY +
                this.contentLayout.paddingTop
            )
        );
        //Prefabricated body width
        this.itemW = itemNode.width + this.contentLayout.spacingX;
        this.itemH = itemNode.height + this.contentLayout.spacingY;
        //The maximum quantity of vertical, horizontal prefabrication
        this.horizontalCount = Math.ceil(this.node.width / this.itemW) + 1;
        this.verticalCount = Math.ceil(this.node.height / this.itemH) + 1;

        if (this.contentLayout.type == cc.Layout.Type.GRID) {
            if (
                this.contentLayout.startAxis ==
                cc.Layout.AxisDirection.HORIZONTAL
            ) {
                this.horizontalCount = Math.floor(this.node.width / this.itemW);
            } else {
                this.verticalCount = Math.floor(this.node.height / this.itemH);
            }
        }
    }

    protected onDestroy(): void {
        this.dataList = null;
        this.itemList = null;
        this.itemRendererList = null;
        clearInterval(this.interval);
    }

    /**Use CC.ScrollView itself to mark the sliding */
    setContentPosition(position: cc.Vec2) {
        super.setContentPosition(position);
        this.refresh = true;
    }

    /**
     * Set list sub -item click to call back
     * The callback will carry the data of the current sub -item
     * @param CB callback
     * @param CBT Function Domain
     */
    public setTouchItemCallback(cb: Function, cbT: any): void {
        this.callback = cb;
        this.cbThis = cbT;
    }

    /**Select data */
    private onItemTap(data: any): void {
        this.callback && this.callback.call(this.cbThis, data);
    }

    /**
     * Refresh data
     * @param dataData source single item | queue
     */
    public refreshData(data: any | any[]): void {
        if (Array.isArray(data)) {
            this.dataList = data;
        } else {
            this.dataList = [data];
        }

        if (this.interval) {
            clearInterval(this.interval);
        }
        this.addItem();
        this.refreshContentSize();
        this.forcedRefresh = true;
        this.refresh = true;
        this.interval = setInterval(this.refreshItem.bind(this), 1000 / 10);
    }

    /**Add prefabrication */
    private addItem(): void {
        let len: number = 0;
        switch (this.contentLayout.type) {
            case cc.Layout.Type.HORIZONTAL:
                len = this.horizontalCount;
                break;
            case cc.Layout.Type.VERTICAL:
                len = this.verticalCount;
                break;
            case cc.Layout.Type.GRID:
                len = this.horizontalCount * this.verticalCount;
                break;
        }
        len = Math.min(len, this.dataList.length);

        let itemListLen = this.itemList.length;
        if (itemListLen < len) {
            let itemRenderer = null;
            for (var i = itemListLen; i < len; i++) {
                let child =
                    this.itemPool.length > 0
                        ? this.itemPool.shift()
                        : cc.instantiate(this.itemRenderer);
                this.content.addChild(child);
                this.itemList.push(child);
                itemRenderer = child.getComponent(AItemRenderer);
                this.itemRendererList.push(itemRenderer);

                if (itemRenderer.isClick) {
                    itemRenderer.setTouchCallback(this.onItemTap, this);
                }
            }
        } else {
            let cL: number = this.content.childrenCount;
            let item;
            while (cL > len) {
                item = this.itemList[cL - 1];
                this.content.removeChild(item);
                this.itemList.splice(cL - 1, 1);
                this.itemRendererList.splice(cL - 1, 1);
                this.itemPool.push(item);
                cL = this.content.childrenCount;
            }
        }
    }

    /**Change Content high height according to the number of data */
    private refreshContentSize(): void {
        let layout: cc.Layout = this.contentLayout;
        let dataListLen: number = this.dataList.length;
        switch (this.contentLayout.type) {
            case cc.Layout.Type.VERTICAL:
                this.content.height =
                    layout.paddingTop +
                    dataListLen * this.itemH +
                    layout.paddingBottom;
                break;
            case cc.Layout.Type.HORIZONTAL:
                this.content.width =
                    layout.paddingLeft +
                    dataListLen * this.itemW +
                    layout.paddingRight;
                break;
            case cc.Layout.Type.GRID:
                if (
                    this.contentLayout.startAxis ==
                    cc.Layout.AxisDirection.HORIZONTAL
                ) {
                    this.content.height =
                        layout.paddingTop +
                        Math.ceil(dataListLen / this.horizontalCount) *
                            this.itemH +
                        layout.paddingBottom;
                } else if (
                    this.contentLayout.startAxis ==
                    cc.Layout.AxisDirection.VERTICAL
                ) {
                    this.content.width =
                        layout.paddingLeft +
                        Math.ceil(dataListLen / this.verticalCount) *
                            this.itemW +
                        layout.paddingRight;
                }
                break;
        }
    }

    /**Refresh the position and data filling of the prefabricated body */
    private refreshItem(): void {
        if (!this.refresh) {
            return;
        }
        switch (this.contentLayout.type) {
            case cc.Layout.Type.HORIZONTAL:
                this.refreshHorizontal();
                break;
            case cc.Layout.Type.VERTICAL:
                this.refreshVertical();
                break;
            case cc.Layout.Type.GRID:
                this.refreshGrid();
                break;
        }
        this.refresh = false;
        this.forcedRefresh = false;
    }

    /**Refresh level */
    private refreshHorizontal() {
        let start = Math.floor(
            Math.abs(this.getContentPosition().x) / this.itemW
        );
        if (start < 0 || this.getContentPosition().x > 0) {
            //Beyond the border processing
            start = 0;
        }
        let end = start + this.horizontalCount;
        if (end > this.dataList.length) {
            //Beyond the border processing
            end = this.dataList.length;
            start = Math.max(end - this.horizontalCount, 0);
        }
        let tempV = 0;
        let itemListLen = this.itemList.length;
        let item, idx;
        for (var i = 0; i < itemListLen; i++) {
            idx = (start + i) % itemListLen;
            item = this.itemList[idx];
            tempV = this.startPos.x + (start + i) * this.itemW;
            if (item.x != tempV || this.forcedRefresh) {
                console.log("Modified data=" + (start + i));
                item.x = tempV;
                this.itemRendererList[idx].data = this.dataList[start + i];
            }
        }
    }

    /**Refresh */
    private refreshVertical(): void {
        let start = Math.floor(
            Math.abs(this.getContentPosition().y) / this.itemH
        );
        if (start < 0 || this.getContentPosition().y < 0) {
            start = 0;
        }

        let end = start + this.verticalCount;
        if (end > this.dataList.length) {
            end = this.dataList.length;
            start = Math.max(end - this.verticalCount, 0);
        }

        let tempV = 0;
        let itemListLen = this.itemList.length;
        let item, idx;
        for (var i = 0; i < itemListLen; i++) {
            idx = (start + i) % itemListLen;
            item = this.itemList[idx];
            tempV = this.startPos.y + -(start + i) * this.itemH;
            if (item.y != tempV || this.forcedRefresh) {
                console.log("Modified data =" + (start + i));
                item.y = tempV;
                this.itemRendererList[idx].data = this.dataList[start + i];
            }
        }
    }

    /**Refresh grid */
    private refreshGrid(): void {
        //Whether to add a grid in vertical direction
        let isVDirection =
            this.contentLayout.startAxis == cc.Layout.AxisDirection.VERTICAL;
        let start =
            Math.floor(Math.abs(this.getContentPosition().y) / this.itemH) *
            this.horizontalCount;
        if (isVDirection) {
            start =
                Math.floor(Math.abs(this.getContentPosition().x) / this.itemW) *
                this.verticalCount;
            if (this.getContentPosition().x > 0) {
                start = 0;
            }
        } else if (this.getContentPosition().y < 0) {
            start = 0;
        }

        if (start < 0) {
            start = 0;
        }

        let end = start + this.horizontalCount * this.verticalCount;
        if (end > this.dataList.length) {
            end = this.dataList.length;
            start = Math.max(
                end - this.horizontalCount * this.verticalCount,
                0
            );
        }

        let tempX = 0;
        let tempY = 0;
        let itemListLen = this.itemList.length;
        let item, idx;
        for (var i = 0; i < itemListLen; i++) {
            idx = (start + i) % itemListLen;
            item = this.itemList[idx];
            if (isVDirection) {
                tempX =
                    this.startPos.x +
                    Math.floor((start + i) / this.verticalCount) * this.itemW;
                tempY =
                    this.startPos.y +
                    -((start + i) % this.verticalCount) * this.itemH;
            } else {
                tempX =
                    this.startPos.x +
                    ((start + i) % this.horizontalCount) * this.itemW;
                tempY =
                    this.startPos.y +
                    -Math.floor((start + i) / this.horizontalCount) *
                        this.itemH;
            }

            if (item.y != tempY || item.x != tempX || this.forcedRefresh) {
                console.log("Modified data=" + (start + i));
                item.x = tempX;
                item.y = tempY;
                this.itemRendererList[idx].data = this.dataList[start + i];
            }
        }
    }
}

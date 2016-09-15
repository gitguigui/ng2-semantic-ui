import {Directive, HostBinding, ElementRef, AfterViewInit, Renderer} from "@angular/core";

export interface ISuiAnimation {
    name:string;
    classes?:string[];
    duration?:number;
    static?:boolean;
    display?:string;
    direction?:string;
    callback?:() => any;
}

@Directive({
    selector: '[suiTransition]',
    exportAs: 'transition'
})
export class SuiTransition {
    constructor(private el:ElementRef, private renderer:Renderer) {
        this.renderer.setElementClass(this.el.nativeElement, "transition", true);

        setTimeout(() => {
            let style = window.getComputedStyle(this.el.nativeElement);
            if (this.isVisible === null) {
                this.isVisible = style.display !== 'none';
            }
        });
    }

    private _isAnimating = false;

    public get isAnimating() {
        return this._isAnimating;
    }

    public set isAnimating(value:boolean) {
        this._isAnimating = value;
        this.renderer.setElementClass(this.el.nativeElement, "animating", value);
    }

    private animationTimeout:number;

    private _isVisible = null;

    public get isVisible() {
        return this._isVisible;
    }

    public set isVisible(value:boolean) {
        this._isVisible = value;
        this.renderer.setElementClass(this.el.nativeElement, "visible", value);
        this.isHidden = this.isVisible !== null && !this.isVisible && !this.isAnimating;
    }

    private _isHidden;

    public get isHidden() {
        return this._isHidden;
    }

    public set isHidden(value:boolean) {
        this._isHidden = value;
        this.renderer.setElementClass(this.el.nativeElement, "hidden", value);
    }

    private queue:ISuiAnimation[] = [];

    private queueFirst() {
        return this.queue.slice(0, 1).pop();
    }

    public animate(animation:ISuiAnimation) {
        animation.classes = animation.name.split(" ");
        if (!animation.duration) {
            animation.duration = 250;
        }
        if (!animation.display) {
            animation.display = 'block';
        }
        if (!animation.static) {
            animation.static = ["jiggle", "flash", "shake", "pulse", "tada", "bounce"].indexOf(animation.name) != -1;
        }
        if (!animation.direction) {
            animation.direction = this.isVisible ? "out" : "in";
            let queueLast = this.queueFirst();
            if (queueLast) {
                animation.direction = queueLast.direction == "in" ? "out" : "in"
            }
        }

        this.queue.push(animation);
        this.performAnimation();
    }

    private performAnimation() {
        if (this.isAnimating) {
            return;
        }
        let animation = this.queue.slice(0, 1).pop();
        if (!animation) {
            return;
        }

        this.isAnimating = true;
        this.isHidden = false;

        animation.classes.forEach(c => this.renderer.setElementClass(this.el.nativeElement, c, true));
        this.renderer.setElementClass(this.el.nativeElement, animation.direction, true);
        this.renderer.setElementStyle(this.el.nativeElement, `animationDuration`, `${animation.duration}ms`);
        if (animation.direction == "in") {
            this.renderer.setElementStyle(this.el.nativeElement, `display`, animation.display);
        }

        this.animationTimeout = setTimeout(() => this.finishAnimation(animation), animation.duration);
    }

    private finishAnimation(animation:ISuiAnimation) {
        this.isAnimating = false;
        animation.classes.forEach(c => this.renderer.setElementClass(this.el.nativeElement, c, false));
        this.renderer.setElementClass(this.el.nativeElement, animation.direction, false);
        this.renderer.setElementStyle(this.el.nativeElement, `animationDuration`, null);
        this.renderer.setElementStyle(this.el.nativeElement, `display`, null);

        this.isVisible = animation.direction == "in" ? true : false;
        if (animation.static) {
            this.isVisible = !this.isVisible;
        }

        if (animation.callback) {
            animation.callback();
        }

        this.queue.shift();

        this.performAnimation();
    }

    public stop() {
        if (this.isAnimating) {
            clearTimeout(this.animationTimeout);
            this.finishAnimation(this.queueFirst());
        }
    }

    public stopAll() {
        if (this.isAnimating) {
            clearTimeout(this.animationTimeout);
            this.finishAnimation(this.queueFirst());
        }
        this.clearQueue();
    }

    public clearQueue() {
        if (this.isAnimating) {
            this.queue = [this.queueFirst()];
            return;
        }
        this.queue = [];
    }
}

export const SUI_TRANSITION_DIRECTIVES = [SuiTransition];
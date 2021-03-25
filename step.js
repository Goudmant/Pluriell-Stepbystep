import merge from 'deepmerge';
import { Evented } from './evented.js';
import autoBind from './utils/auto-bind.js';
import { isElement, isHTMLElement, isFunction, isUndefined } from './utils/type-check.js';
import { bindAdvance } from './utils/bind.js';
import {
  setupTooltip,
  parseAttachTo,
  normalizePrefix,
  uuid
} from './utils/general.js';
import ShepherdElement from './components/shepherd-element.svelte';

// Polyfills
import smoothscroll from 'smoothscroll-polyfill';
smoothscroll.polyfill();

export class Step extends Evented {

  constructor(tour, options = {}) {
    super(tour, options);
    this.tour = tour;
    this.classPrefix = this.tour.options
      ? normalizePrefix(this.tour.options.classPrefix)
      : '';
    this.styles = tour.styles;

    autoBind(this);

    this._setOptions(options);

    return this;
  }

  cancel() {
    this.tour.cancel();
    this.trigger('cancel');
  }

  complete() {
    this.tour.complete();
    this.trigger('complete');
  }

  destroy() {
    if (this.tooltip) {
      this.tooltip.destroy();
      this.tooltip = null;
    }

    if (isHTMLElement(this.el) && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
      this.el = null;
    }

    this._updateStepTargetOnHide();

    this.trigger('destroy');
  }

  getTour() {
    return this.tour;
  }

  hide() {
    this.tour.modal.hide();

    this.trigger('before-hide');

    if (this.el) {
      this.el.hidden = true;
    }

    this._updateStepTargetOnHide();

    this.trigger('hide');
  }

  isCentered() {
    const attachToOptions = parseAttachTo(this);
    return !attachToOptions.element || !attachToOptions.on;
  }

  isOpen() {
    return Boolean(this.el && !this.el.hidden);
  }

  show() {
    if (isFunction(this.options.beforeShowPromise)) {
      const beforeShowPromise = this.options.beforeShowPromise();
      if (!isUndefined(beforeShowPromise)) {
        return beforeShowPromise.then(() => this._show());
      }
    }
    this._show();
  }

  updateStepOptions(options) {
    Object.assign(this.options, options);

    if (this.shepherdElementComponent) {
      this.shepherdElementComponent.$set({ step: this });
    }
  }

  getElement() {
    return this.el;
  }

  getTarget() {
    return this.target;
  }

  _createTooltipContent() {
    const descriptionId = `${this.id}-description`;
    const labelId = `${this.id}-label`;

    this.shepherdElementComponent = new ShepherdElement({
      target: this.tour.options.stepsContainer || document.body,
      props: {
        classPrefix: this.classPrefix,
        descriptionId,
        labelId,
        step: this,
        styles: this.styles
      }
    });

    return this.shepherdElementComponent.getElement();
  }

  _scrollTo(scrollToOptions) {
    const { element } = parseAttachTo(this);

    if (isFunction(this.options.scrollToHandler)) {
      this.options.scrollToHandler(element);
    } else if (
      isElement(element) &&
      typeof element.scrollIntoView === 'function'
    ) {
      element.scrollIntoView(scrollToOptions);
    }
  }

  _getClassOptions(stepOptions) {
    const defaultStepOptions =
      this.tour && this.tour.options && this.tour.options.defaultStepOptions;
    const stepClasses = stepOptions.classes ? stepOptions.classes : '';
    const defaultStepOptionsClasses =
      defaultStepOptions && defaultStepOptions.classes
        ? defaultStepOptions.classes
        : '';
    const allClasses = [
      ...stepClasses.split(' '),
      ...defaultStepOptionsClasses.split(' ')
    ];
    const uniqClasses = new Set(allClasses);

    return Array.from(uniqClasses).join(' ').trim();
  }

  _setOptions(options = {}) {
    let tourOptions =
      this.tour && this.tour.options && this.tour.options.defaultStepOptions;

    tourOptions = merge({}, tourOptions || {});

    this.options = Object.assign(
      {
        arrow: true
      },
      tourOptions,
      options
    );

    const { when } = this.options;

    this.options.classes = this._getClassOptions(options);

    this.destroy();
    this.id = this.options.id || `step-${uuid()}`;

    if (when) {
      Object.keys(when).forEach((event) => {
        this.on(event, when[event], this);
      });
    }
  }

  _setupElements() {
    if (!isUndefined(this.el)) {
      this.destroy();
    }

    this.el = this._createTooltipContent();

    if (this.options.advanceOn) {
      bindAdvance(this);
    }
    setupTooltip(this);
  }

  _show() {
    this.trigger('before-show');

    this._setupElements();

    if (!this.tour.modal) {
      this.tour._setupModal();
    }

    this.tour.modal.setupForStep(this);
    this._styleTargetElementForStep(this);
    this.el.hidden = false;


    if (this.options.scrollTo) {
      setTimeout(() => {
        this._scrollTo(this.options.scrollTo);
      });
    }

    this.el.hidden = false;

    const content = this.shepherdElementComponent.getElement();
    const target = this.target || document.body;
    target.classList.add(`${this.classPrefix}shepherd-enabled`);
    target.classList.add(`${this.classPrefix}shepherd-target`);
    content.classList.add('shepherd-enabled');

    this.trigger('show');
  }

  _styleTargetElementForStep(step) {
    const targetElement = step.target;

    if (!targetElement) {
      return;
    }

    if (step.options.highlightClass) {
      targetElement.classList.add(step.options.highlightClass);
    }

    if (step.options.canClickTarget === false) {
      targetElement.classList.add('shepherd-target-click-disabled');
    }
  }

  /**
   * When a step is hidden, remove the highlightClass and 'shepherd-enabled'
   * and 'shepherd-target' classes
   * @private
   */
  _updateStepTargetOnHide() {
    const target = this.target || document.body;

    if (this.options.highlightClass) {
      target.classList.remove(this.options.highlightClass);
    }

    target.classList.remove(
      'shepherd-target-click-disabled',
      `${this.classPrefix}shepherd-enabled`,
      `${this.classPrefix}shepherd-target`
    );
  }
}

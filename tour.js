import { Evented } from './evented.js';
import { Step } from './step.js';
import autoBind from './utils/auto-bind.js';
import { isHTMLElement, isFunction, isString, isUndefined } from './utils/type-check.js';
import { cleanupSteps } from './utils/cleanup.js';
import { normalizePrefix, uuid } from './utils/general.js';
import ShepherdModal from './components/shepherd-modal.svelte';

const Shepherd = new Evented();

export class Tour extends Evented {

  constructor(options = {}) {
    super(options);

    autoBind(this);

    const defaultTourOptions = {
      exitOnEsc: true,
      keyboardNavigation: true
    };

    this.options = Object.assign({}, defaultTourOptions, options);
    this.classPrefix = normalizePrefix(this.options.classPrefix);
    this.steps = [];
    this.addSteps(this.options.steps);

    // Pass these events onto the global Shepherd object
    const events = ['active', 'cancel', 'complete', 'inactive', 'show', 'start'];
    events.map((event) => {
      ((e) => {
        this.on(e, (opts) => {
          opts = opts || {};
          opts.tour = this;
          Shepherd.trigger(e, opts);
        });
      })(event);
    });

    this._setTourID();

    return this;
  }

  addStep(options, index) {
    let step = options;

    if (!(step instanceof Step)) {
      step = new Step(this, step);
    } else {
      step.tour = this;
    }

    if (!isUndefined(index)) {
      this.steps.splice(index, 0, step);
    } else {
      this.steps.push(step);
    }

    return step;
  }

  addSteps(steps) {
    if (Array.isArray(steps)) {
      steps.forEach((step) => {
        this.addStep(step);
      });
    }

    return this;
  }

  back() {
    const index = this.steps.indexOf(this.currentStep);
    this.show(index - 1, false);
  }

  cancel() {
    if (this.options.confirmCancel) {
      const cancelMessage = this.options.confirmCancelMessage || 'Are you sure you want to stop the tour?';
      const stopTour = window.confirm(cancelMessage);
      if (stopTour) {
        this._done('cancel');
      }
    } else {
      this._done('cancel');
    }
  }

  complete() {
    this._done('complete');
  }

  getById(id) {
    return this.steps.find((step) => {
      return step.id === id;
    });
  }


  getCurrentStep() {
    return this.currentStep;
  }

  hide() {
    const currentStep = this.getCurrentStep();

    if (currentStep) {
      return currentStep.hide();
    }
  }


  isActive() {
    return Shepherd.activeTour === this;
  }


  next() {
    const index = this.steps.indexOf(this.currentStep);

    if (index === this.steps.length - 1) {
      this.complete();
    } else {
      this.show(index + 1, true);
    }
  }

  removeStep(name) {
    const current = this.getCurrentStep();

    // Find the step, destroy it and remove it from this.steps
    this.steps.some((step, i) => {
      if (step.id === name) {
        if (step.isOpen()) {
          step.hide();
        }

        step.destroy();
        this.steps.splice(i, 1);

        return true;
      }
    });

    if (current && current.id === name) {
      this.currentStep = undefined;

      // If we have steps left, show the first one, otherwise just cancel the tour
      this.steps.length ? this.show(0) : this.cancel();
    }
  }

  show(key = 0, forward = true) {
    const step = isString(key) ? this.getById(key) : this.steps[key];

    if (step) {
      this._updateStateBeforeShow();

      const shouldSkipStep = isFunction(step.options.showOn) && !step.options.showOn();

      // If `showOn` returns false, we want to skip the step, otherwise, show the step like normal
      if (shouldSkipStep) {
        this._skipStep(step, forward);
      } else {
        this.trigger('show', {
          step,
          previous: this.currentStep
        });

        this.currentStep = step;
        step.show();
      }
    }
  }

  /**
   * Start the tour
   */
  start() {
    this.trigger('start');

    // Save the focused element before the tour opens
    this.focusedElBeforeOpen = document.activeElement;

    this.currentStep = null;

    this._setupModal();

    this._setupActiveTour();
    this.next();
  }

  _done(event) {
    const index = this.steps.indexOf(this.currentStep);
    if (Array.isArray(this.steps)) {
      this.steps.forEach((step) => step.destroy());
    }

    cleanupSteps(this);

    this.trigger(event, { index });

    Shepherd.activeTour = null;
    this.trigger('inactive', { tour: this });

    if (this.modal) {
      this.modal.hide();
    }

    if (event === 'cancel' || event === 'complete') {
      if (this.modal) {
        const modalContainer = document.querySelector('.shepherd-modal-overlay-container');

        if (modalContainer) {
          modalContainer.remove();
        }
      }
    }

    // Focus the element that was focused before the tour started
    if (isHTMLElement(this.focusedElBeforeOpen)) {
      this.focusedElBeforeOpen.focus();
    }
  }

  _setupActiveTour() {
    this.trigger('active', { tour: this });

    Shepherd.activeTour = this;
  }

  _setupModal() {
    this.modal = new ShepherdModal({
      target: this.options.modalContainer || document.body,
      props:
      {
        classPrefix: this.classPrefix,
        styles: this.styles
      }
    });
  }

  _skipStep(step, forward) {
    const index = this.steps.indexOf(step);
    const nextIndex = forward ? index + 1 : index - 1;
    this.show(nextIndex, forward);
  }

  _updateStateBeforeShow() {
    if (this.currentStep) {
      this.currentStep.hide();
    }

    if (!this.isActive()) {
      this._setupActiveTour();
    }
  }

  _setTourID() {
    const tourName = this.options.tourName || 'tour';

    this.id = `${tourName}--${uuid()}`;
  }
}

export { Shepherd };

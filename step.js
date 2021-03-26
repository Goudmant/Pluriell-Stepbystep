const tour = new Shepherd.Tour({
    defaultStepOptions: {
        classes: 'Shadow-md bg-purple-dark',
        scrollTo: true
    }
});

tour.addStep({
id: 'example-step',
text: 'Bienvenue dans le parcours utilisateur !',
attachTo: {
element: '.example-css-selector',
on: 'bottom'
},
 classes: 'example-step-extra-class',
 buttons: [
    {
    action() {
        return this.next();
        },
        text: 'Suivant'
    }
],
id: 'creating'
});

tour.addStep({
id: 'example-step',
text: 'Commencer a configurer votre compte.',
attachTo: {
element: '.step2',
on: 'bottom'
},
classes: 'example-step-extra-class',
buttons: [
    {
    action() {
        return this.back();
        },
        classes: 'shepherd-button-secondary',
        text: 'Précendent'
    },
    {
    action() {
        return this.next();
        },
        text: 'Suivant'
        }
],
    id: 'creating'
});

tour.addStep({
    id: 'example-step',
    text: 'Commencer a configurer votre compte.',
    attachTo: {
    element: '.step2',
    on: 'bottom'
    },
    classes: 'example-step-extra-class',
    buttons: [
    {
    action() {
        return this.back();
    },
    classes: 'shepherd-button-secondary',
    text: 'Précedent'
    },
    {
    action() {
         return this.next();
    },
    text: 'Suivant'
    }
    ],
    id: 'creating'
    });




tour.start();

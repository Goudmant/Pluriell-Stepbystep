const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const  finishBtn  =  document.getElementById('finishBtn');
const stepNumbers = document.querySelectorAll(".step-number");
const stepProgression = document.querySelector("#stepProgression");

let currentStep = 1;
update();

stepNumbers.forEach((step, i) => {
    step.onclick = () => {
        currentStep = i + 1;
        update();
    }
});

prevBtn.onclick = () => {
    currentStep--;
    update();
};

nextBtn.onclick = () => {
    currentStep++;
    update();
};

finishBtn.addEventListener('click',  ()  =>  {
	location.reload();
});

function update() {
    prevBtn.disabled = false;
    nextBtn.disabled = false;
    if (currentStep <= 1) {
        currentStep = 1;
        prevBtn.disabled = true;
    } else if (currentStep >= stepNumbers.length) {
        currentStep = stepNumbers.length;
        nextBtn.disabled = true;
    }

    stepNumbers.forEach((step, i) => {
        if (currentStep > i) {
            step.classList.add("active");
        } else {
            step.classList.remove("active");
        }
    });

    stepProgression.style.width = 
        ((currentStep - 1) / (stepNumbers.length - 1 )) * 100 + "%";

}

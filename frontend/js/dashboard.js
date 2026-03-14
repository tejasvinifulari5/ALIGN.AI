document.addEventListener("DOMContentLoaded", () => {


  // Start Workout Button

  const startWorkoutBtn = document.querySelectorAll(".nav-item")[0];

  if (startWorkoutBtn) {
    startWorkoutBtn.addEventListener("click", () => {
      alert("Workout module will start here.");
      // future: window.location.href = "workout.html";
    });
  }

  // View Progress Button
  const progressBtn = document.querySelectorAll(".nav-item")[1];

  if (progressBtn) {
    progressBtn.addEventListener("click", () => {
      alert("Progress analytics page coming soon.");
      // future: window.location.href = "progress.html";
    });
  }

  // Exercise Instructions Button
  const exerciseBtn = document.querySelectorAll(".nav-item")[2];

  if (exerciseBtn) {
    exerciseBtn.addEventListener("click", () => {
      alert("Exercise guide will open here.");
      // future: window.location.href = "exercises.html";
    });
  }

});


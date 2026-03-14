        function handleSelect(element) {
            document.querySelectorAll('.exercise-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            element.classList.add('selected');
            const radio = element.querySelector('input');
            radio.checked = true;
        }

        const cameraBtn = document.getElementById('cameraBtn');
        const btnLoader = document.getElementById('btnLoader');
        const btnText = document.getElementById('btnText');
        const modal = document.getElementById('modal');
        const modalText = document.getElementById('modalText');

        cameraBtn.addEventListener('click', () => {
            const selected = document.querySelector('input[name="exercise"]:checked');
            
            if (!selected) {
                cameraBtn.classList.add('animate-bounce');
                setTimeout(() => cameraBtn.classList.remove('animate-bounce'), 500);
                showModal("Please select an exercise routine to begin your session.");
                return;
            }

            btnText.style.display = 'none';
            btnLoader.style.display = 'block';
            cameraBtn.style.pointerEvents = 'none';

            let instruction = "";
            switch(selected.value) {
                case 'bicep_curls':
                    instruction = "Position your camera to see your side profile clearly.";
                    break;
                case 'squats':
                    instruction = "Stand back so your whole body is visible in the frame.";
                    break;
                case 'pushups':
                    instruction = "Place the camera low to track your plank and pushup form.";
                    break;
            }

            setTimeout(() => {
                showModal(`${instruction} Initializing your ${selected.value.replace('_', ' ')} session...`);
                btnText.style.display = 'block';
                btnLoader.style.display = 'none';
                cameraBtn.style.pointerEvents = 'auto';
            }, 800);
        });

        function showModal(msg) {
            modalText.innerText = msg;
            modal.style.display = 'flex';
        }

        function closeModal() {
            modal.style.display = 'none';
        }

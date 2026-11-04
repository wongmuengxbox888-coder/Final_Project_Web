const avatarButton = document.getElementById('avatarButton');
  const userDropdown = document.getElementById('userDropdown');

  avatarButton.addEventListener('click', function () {
    userDropdown.classList.toggle('hidden');
  });

/// หน้า dropdown นะ มาเพิ่ม id ตรงนี้  ถ้าใครใช้ก้แค่เพิ่มไอดีหน้านี้ละก้ html by Beaver 


//slide bar
const slider = document.getElementById("slider");
    const number = document.getElementById("number");

    slider.addEventListener("input", function() {
        let value = slider.value;
        number.textContent = slider.value;

        slider.style.background =
            `linear-gradient(to right, #397B8D 0%, #397B8D ${value * 0.5}%, #5AAEAF ${value}%, #e5e7eb ${value}%)`;
    });
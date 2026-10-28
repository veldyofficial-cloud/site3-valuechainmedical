(function () {
  'use strict';

  var widgets = ['w20241004d7a5718eb0438', 'w2024101115a638ebad0c3'];
  widgets.forEach(function (id) {
    var widget = document.getElementById(id);
    var form = document.getElementById('addForm' + id);
    if (!widget || !form) return;

    var oldButton = widget.querySelector('._input_form_submit');
    var button = document.createElement('button');
    button.type = 'submit';
    button.className = oldButton.className;
    button.setAttribute('form', form.id);
    button.textContent = 'Send';
    oldButton.replaceWith(button);
    form.removeAttribute('target');

    // These hidden fields belonged to the original hosted form backend.
    form.querySelectorAll('input[type="hidden"]').forEach(function (input) { input.remove(); });
    var fields = {
      name: form.querySelector('[name="input_a4d73821a4fec"]'),
      company: form.querySelector('[name="input_6l3Rw55534"]'),
      email: form.querySelector('[name="email_75T51108Z7"]'),
      message: form.querySelector('textarea')
    };
    ['name', 'company', 'email'].forEach(function (key) { fields[key].required = true; });
    fields.email.type = 'email';
    fields.name.autocomplete = 'name';
    fields.company.autocomplete = 'organization';
    fields.email.autocomplete = 'email';
    var phones = Array.from(form.querySelectorAll('input[type="tel"]'));
    phones.forEach(function (input, index) {
      input.required = true;
      input.pattern = '[0-9]{1,4}';
      input.setAttribute('aria-label', 'Phone part ' + (index + 1));
    });
    var choices = Array.from(form.querySelectorAll('input[type="checkbox"]'));

    // Share links work on the free plan, without the old upload endpoint.
    var fileGroup = form.querySelector('.form-group[id^="file_"]');
    fileGroup.replaceChildren();
    var linkLabel = document.createElement('label');
    linkLabel.className = 'control-label';
    linkLabel.htmlFor = 'information-link-' + id;
    linkLabel.textContent = 'Information — 자료 공유 링크 (선택)';
    var link = document.createElement('input');
    link.type = 'url';
    link.id = linkLabel.htmlFor;
    link.className = 'form-control';
    link.name = 'information_link';
    link.placeholder = 'https://... (Google Drive, Dropbox 등)';
    fileGroup.append(linkLabel, link);

    var trap = document.createElement('input');
    trap.type = 'checkbox';
    trap.name = 'botcheck';
    trap.tabIndex = -1;
    trap.style.display = 'none';
    trap.setAttribute('aria-hidden', 'true');
    form.append(trap);
    var status = document.createElement('p');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.style.marginTop = '16px';
    button.parentNode.append(status);
    var sending = false;
    choices.forEach(function (choice) {
      choice.addEventListener('change', function () { choices[0].setCustomValidity(''); });
    });

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (sending || trap.checked) return;
      var selected = choices.filter(function (choice) { return choice.checked; });
      choices[0].setCustomValidity(selected.length ? '' : '문의 유형을 하나 이상 선택해주세요.');
      if (!form.reportValidity()) return;
      if (!fields.name.value.trim() || !fields.company.value.trim()) {
        status.textContent = '이름과 기업명 / 직함을 입력해주세요.';
        return;
      }
      sending = true;
      button.disabled = true;
      button.textContent = 'Sending…';
      form.setAttribute('aria-busy', 'true');
      status.textContent = '문의를 전송하고 있습니다.';
      try {
        var response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: '9a043a19-ffe3-4a89-abb5-ccfc4cb02147',
            subject: '[Value Chain Medical] 새로운 웹사이트 문의',
            from_name: 'Value Chain Medical Website',
            name: fields.name.value.trim(),
            company: fields.company.value.trim(),
            email: fields.email.value.trim(),
            phone: phones.map(function (input) { return input.value.trim(); }).join('-'),
            inquiry: selected.map(function (choice) { return choice.value.trim(); }).join(', '),
            information_link: link.value.trim(),
            message: fields.message.value.trim(),
            botcheck: false
          })
        });
        var result = await response.json();
        if (!response.ok || !result.success) throw new Error('Submission failed');
        form.reset();
        status.textContent = '문의가 전송되었습니다. 감사합니다! Your inquiry has been sent.';
      } catch (error) {
        status.textContent = '전송하지 못했습니다. 입력 내용은 유지되어 있습니다. 잠시 후 다시 시도해주세요.';
      } finally {
        sending = false;
        button.disabled = false;
        button.textContent = 'Send';
        form.removeAttribute('aria-busy');
      }
    });
  });
})();

class FormAutomator {
  constructor(formId, language = 'en-US') {
    this.form = document.getElementById(formId);
    this.language = language;
    this.speechRecognition = this.initializeSpeechRecognition();
    this.questions = Array.from(this.form.querySelectorAll('[data-question]')); // Questions have a data attribute
  }

  // Initialize Speech Recognition
  initializeSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition API is not supported in this browser.");
      return null;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = this.language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    return recognition;
  }

  // Read out a question using Speech Synthesis
  speakText(text) {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.language;
      utterance.onend = resolve; // Resolve when speaking ends
      window.speechSynthesis.speak(utterance);
    });
  }

  // Listen for the user's spoken response
  listenForResponse() {
    return new Promise((resolve, reject) => {
      this.speechRecognition.start();
      this.speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('User Response:', transcript);
        resolve(transcript);
      };
      this.speechRecognition.onerror = (event) => {
        console.error('Speech Recognition Error:', event.error);
        reject(event.error);
      };
    });
  }

  // Confirm the user's response before moving to the next question
  async confirmResponse(responseText) {
    await this.speakText(`You said: ${responseText}. Say "OK" to confirm.`);
    const confirmation = await this.listenForResponse();
    return confirmation.toLowerCase() === "ok";
  }

  // Main function to automate form filling
  async startAutomation() {
    if (!this.speechRecognition) return;

    for (let questionElement of this.questions) {
      const questionText = questionElement.getAttribute('data-question');
      await this.speakText(questionText);

      let responseText = await this.listenForResponse();
      const confirmed = await this.confirmResponse(responseText);

      if (confirmed) {
        questionElement.querySelector('input, textarea').value = responseText;
        await this.speakText("Response saved.");
      } else {
        await this.speakText("Let's try again.");
        responseText = await this.listenForResponse();
      }
    }
    await this.speakText("Form completed.");
  }
}

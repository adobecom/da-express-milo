// Standard failure output/traces may contain IMS redirect queries. Emit only our sanitized report.
class DiagnosticReporter {
  constructor() {
    this.prefix = 'UniversalNav diagnostic';
  }

  onBegin(config, suite) {
    console.info(`${this.prefix}: ${suite.allTests().length} selected test(s).`);
  }

  onTestEnd(test, result) {
    console.info(`${this.prefix} C2 signed-out test: ${result.status}`);
    for (const attachment of result.attachments) {
      if (attachment.name === 'unav-diagnostic' && attachment.body) {
        console.info(attachment.body.toString('utf8'));
      }
    }
  }

  onError() {
    console.error(`${this.prefix}: runner error; raw error omitted to protect authentication URLs.`);
  }

  onEnd(result) {
    console.info(`${this.prefix} result: ${result.status}`);
  }
}

module.exports = DiagnosticReporter;

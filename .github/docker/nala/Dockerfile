ARG PLAYWRIGHT_VERSION=1.52.0
FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble

ARG PLAYWRIGHT_VERSION
USER root
RUN npx --yes playwright@${PLAYWRIGHT_VERSION} install chrome \
    && test -x /opt/google/chrome/chrome

LABEL org.opencontainers.image.source="https://github.com/adobecom/da-express-milo"
ENV NALA_PLAYWRIGHT_VERSION=${PLAYWRIGHT_VERSION}
USER 1001

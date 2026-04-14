ARG BACKEND_BASE_IMAGE

FROM node:24-alpine AS build

WORKDIR     /build

ADD         . /build

RUN npm i && \
    npm run build

FROM ${BACKEND_BASE_IMAGE}

COPY --from=build /build/dist/ /flibooks/static/

RUN echo "" >> /flibooks/flibooks.properties && \
    echo "ApiPrefix = /api" >> /flibooks/flibooks.properties  && \
    echo "" >> /flibooks/flibooks.properties

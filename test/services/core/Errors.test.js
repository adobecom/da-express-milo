import { expect } from '@esm-bundle/chai';
import {
  ServiceError,
  AuthenticationError,
  ApiError,
  ValidationError,
  NotFoundError,
  PluginRegistrationError,
} from '../../../express/code/libs/services/core/Errors.js';

describe('service errors', () => {
  it('ServiceError sets defaults and serializes to JSON', () => {
    const error = new ServiceError('base fail');
    const json = error.toJSON();

    expect(error.name).to.equal('ServiceError');
    expect(error.code).to.equal('SERVICE_ERROR');
    expect(error.serviceName).to.equal('Unknown');
    expect(error.topic).to.be.null;
    expect(error.timestamp).to.be.a('string');
    expect(json).to.deep.include({
      name: 'ServiceError',
      message: 'base fail',
      code: 'SERVICE_ERROR',
      serviceName: 'Unknown',
      topic: null,
    });
  });

  it('AuthenticationError sets AUTH_REQUIRED code', () => {
    const error = new AuthenticationError('need login', { serviceName: 'AuthService' });
    expect(error).to.be.instanceOf(ServiceError);
    expect(error.name).to.equal('AuthenticationError');
    expect(error.code).to.equal('AUTH_REQUIRED');
    expect(error.serviceName).to.equal('AuthService');
  });

  it('ApiError maps status code and captures response body', () => {
    const error = new ApiError('404 Not Found', {
      statusCode: 404,
      responseBody: '{"error":"missing"}',
      serviceName: 'Stock',
    });

    expect(error).to.be.instanceOf(ServiceError);
    expect(error.name).to.equal('ApiError');
    expect(error.code).to.equal('404');
    expect(error.statusCode).to.equal(404);
    expect(error.responseBody).to.equal('{"error":"missing"}');
    expect(error.serviceName).to.equal('Stock');
  });

  it('ValidationError sets field and validation code', () => {
    const error = new ValidationError('invalid input', { field: 'query' });
    expect(error).to.be.instanceOf(ServiceError);
    expect(error.name).to.equal('ValidationError');
    expect(error.code).to.equal('VALIDATION_ERROR');
    expect(error.field).to.equal('query');
  });

  it('NotFoundError uses default message and NOT_FOUND code', () => {
    const error = new NotFoundError();
    expect(error).to.be.instanceOf(ServiceError);
    expect(error.name).to.equal('NotFoundError');
    expect(error.message).to.equal('Resource not found');
    expect(error.code).to.equal('NOT_FOUND');
  });

  it('PluginRegistrationError stores pluginName', () => {
    const error = new PluginRegistrationError('duplicate plugin', { pluginName: 'kuler' });
    expect(error).to.be.instanceOf(ServiceError);
    expect(error.name).to.equal('PluginRegistrationError');
    expect(error.code).to.equal('PLUGIN_REGISTRATION_ERROR');
    expect(error.pluginName).to.equal('kuler');
  });
});

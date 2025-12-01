// Type declarations for DA SDK loaded from external URL
declare module 'https://da.live/nx/utils/sdk.js' {
  interface DASDKResponse {
    token: string;
    // Add other properties from the SDK response as needed
  }

  const DA_SDK: Promise<DASDKResponse>;
  export default DA_SDK;
}


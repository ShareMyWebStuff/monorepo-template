/* eslint-disable */
async function handler (event: any) {
    var request = event.request
    var uri = request.uri
  
    if (uri.endsWith('/')) {
      request.uri += 'index.html'
    } else if (!uri.includes('.')) {
      request.uri += '.html'
    }
  
    return request
  }

export default { handler }
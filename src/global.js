// Validate that the client accepts the media type that the server expects
export function validateAccept(request, media = 'application/json') {
	if (!request || !request.headers) return false;

	const acceptHeader = request.headers.get('Accept');

	if (!acceptHeader) return false;

	// Split the Accept header into individual media types
	const acceptedMediaTypes = acceptHeader.split(',');

	// Check if 'application/json' is present in the accepted media types
	return acceptedMediaTypes.some((mediaType) => mediaType.trim() === media);
}

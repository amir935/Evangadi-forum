export const getErrorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
    if (!err?.response) {
        return 'Unable to connect to server. Please check your internet connection.';
    }
    return err.response.data?.msg || fallback;
}
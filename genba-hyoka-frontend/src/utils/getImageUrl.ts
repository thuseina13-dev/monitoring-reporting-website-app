export const getImageUrl = (image: string) => {
  const apiUrl = `${process.env.EXPO_PUBLIC_API_URL}`
  return `${apiUrl}${image}`
}
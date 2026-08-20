import axios from 'axios'

const api = axios.create({
  baseURL: 'https://employee-transport-fleet-management.onrender.com',

})

export default api
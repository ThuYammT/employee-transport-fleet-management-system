const EMPLOYEE_ID_KEY = 'developmentEmployeeId'

export function saveEmployeeId(employeeId: number): void {
  localStorage.setItem(EMPLOYEE_ID_KEY, employeeId.toString())
}

export function getEmployeeId(): number | null {
  const storedId = localStorage.getItem(EMPLOYEE_ID_KEY)

  if (!storedId) {
    return null
  }

  const employeeId = Number(storedId)

  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    return null
  }

  return employeeId
}

export function clearEmployeeId(): void {
  localStorage.removeItem(EMPLOYEE_ID_KEY)
}
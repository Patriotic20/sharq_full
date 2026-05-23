from enum import Enum


class EmployeeStatus(str, Enum):
    WORKER = "worker"
    STUDENT = "student"

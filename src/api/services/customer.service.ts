import { customerRepository } from "@/api/repository/customer.repository";
import type { ListCustomersParams } from "@/api/repository/customer.repository";

export const customerService = {
  async listCustomers(params: ListCustomersParams) {
    return customerRepository.findPaginated(params);
  },

  async getCustomerById(id: string) {
    return customerRepository.findById(id);
  },
};

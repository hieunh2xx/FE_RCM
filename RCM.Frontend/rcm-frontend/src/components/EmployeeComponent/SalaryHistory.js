import React, { useState, useEffect } from "react";
import Header from "../../headerComponent/header";
import { toast } from "react-toastify";

const SalaryHistory = () => {
  const [data, setData] = useState([]);
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isBonusModalOpen, setIsBonusModalOpen] = useState(false);
  const [bonusSalary, setBonusSalary] = useState(0);
  const [penalty, setPenalty] = useState(0);

  useEffect(() => {
    fetchPayrollData();
  }, [selectedMonth, selectedYear]);

  const fetchPayrollData = async () => {
    try {
      let url = `http://localhost:5000/api/Payroll/getAllPayroll?month=${selectedMonth}&year=${selectedYear}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);
      setData(await response.json());
    } catch (err) {
      console.error("Lỗi khi gọi API:", err);
    }
  };

  const exportFile = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/Payroll/export?month=${selectedMonth}&year=${selectedYear}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Lỗi khi tải file từ server");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LichSuLuong_${selectedMonth}_${selectedYear}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Tải file thành công!");
    } catch (error) {
      console.error("Lỗi khi tải file:", error);
      toast.error("Tải file thất bại. Vui lòng thử lại!");
    }
  };

  const openDetailModal = async (employeeId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/Payroll/details?employeeId=${employeeId}&month=${selectedMonth}&year=${selectedYear}`
      );
      if (!response.ok) throw new Error("Lỗi khi lấy dữ liệu nhân viên");
      const employee = await response.json();
      setSelectedEmployee(employee);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu nhân viên:", error);
    }
  };

  const openBonusModal = (employee) => {
    setSelectedEmployee(employee);
    setBonusSalary(employee.bonusSalary);
    setPenalty(employee.penalty);
    setIsBonusModalOpen(true);
  };

  const updateSalary = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/Payroll/update-salary",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: selectedEmployee.employeeId,
            fixedSalary: selectedEmployee.fixedSalary,
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
            finalSalary: 0,
            bonusSalary,
            penalty: 0,
          }),
        }
      );
      if (!response.ok) throw new Error("Cập nhật thất bại");
      toast.success("Cập nhật lương thành công!");
      setIsBonusModalOpen(false);
      fetchPayrollData();
    } catch (error) {
      console.error("Lỗi khi cập nhật lương:", error);
      toast.error("Cập nhật thất bại!");
    }
  };

  return (
    <div>
      <Header />
      <div className="p-10">
        <div className="p-4 border-b bg-white shadow">
          <div className="flex justify-between items-center my-3">
            <div className="text-lg font-bold">Lịch Sử Lương Nhân Viên</div>
            <div className="flex gap-4 items-center">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="border border-gray-300 p-2 rounded w-32 text-center shadow-sm"
              >
                {[...Array(5)].map((_, idx) => (
                  <option key={idx} value={currentYear - 2 + idx}>
                    {currentYear - 2 + idx}
                  </option>
                ))}
              </select>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="border border-gray-300 p-2 rounded w-32 text-center shadow-sm"
              >
                {[...Array(12)].map((_, idx) => (
                  <option key={idx} value={idx + 1}>
                    Tháng {idx + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-between items-center mb-4">
            <div className="space-x-2">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded ml-2"
                onClick={exportFile}
              >
                Xuất Excel
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto mt-4">
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-center">Mã Nhân viên</th>
                <th className="border p-2 text-center">Tên nhân viên</th>
                <th className="border p-2 text-center">SĐT</th>
                <th className="border p-2 text-center">Lương cố định</th>
                <th className="border p-2 text-center">Số ngày công</th>
                <th className="border p-2 text-center">Lương ngày</th>
                <th className="border p-2 text-center">Tiền thưởng tăng ca</th>
                <th className="border p-2 text-center">Tiền lương hiện tại</th>
                {/* <th className="border p-2 text-center">Thao tác</th> */}
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr
                  key={item.employeeId}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => openDetailModal(item.employeeId)}
                >
                  <td className="border p-2 text-center">{item.employeeId}</td>
                  <td className="border p-2">{item.employeeName}</td>
                  <td className="border p-2 text-center">{item.phone}</td>
                  <td className="border p-2 text-center">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(item.fixedSalary)}
                  </td>
                  <td className="border p-2 text-center">
                    {item.totalWorkDays}
                  </td>
                  <td className="border p-2 text-center">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(item.dailySalary)}
                  </td>
                  <td className="border p-2 text-center">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(item.bonusSalary)}
                  </td>
                  <td className="border p-2 text-center font-bold">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(item.totalSalary)}
                  </td>
                  {/* <td className="border p-2 text-center font-bold">
                    <button
                      className="bg-yellow-500 text-white px-2 py-1 rounded "
                      onClick={(e) => {
                        e.stopPropagation();
                        openBonusModal(item);
                      }}
                    >
                      Thưởng tăng ca
                    </button>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal cập nhật lương */}
      {/* {isBonusModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div className="bg-white p-5 rounded shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Cập Nhật Lương</h2>
            <label className="block mb-2">Tiền thưởng:</label>
            <input
              type="number"
              value={bonusSalary}
              onChange={(e) => setBonusSalary(e.target.value)}
              className="border p-2 w-full mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setIsBonusModalOpen(false)}
              >
                Hủy
              </button>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={updateSalary}
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )} */}
      {/* Modal thông tin lương nhân viên */}
      {isDetailModalOpen && selectedEmployee && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div
            className="bg-white p-6 rounded shadow-lg"
            style={{ width: "660px" }}
          >
            <h1 className="text-2xl font-bold mb-4 uppercase">
              Chi Tiết Lương Tháng {selectedMonth}/{selectedYear} Của{" "}
              {selectedEmployee.employee.fullName}
            </h1>

            <div className="space-y-2">
              {[
                { label: "Mã Nhân Viên", value: selectedEmployee.employeeId },
                { label: "Họ tên", value: selectedEmployee.employee.fullName },
                {
                  label: "Giới tính",
                  value:
                    selectedEmployee.employee.gender === "Female"
                      ? "Nữ"
                      : "Nam",
                },
                {
                  label: "Ngày Sinh",
                  value: new Date(
                    selectedEmployee.employee.birthDate
                  ).toLocaleDateString("vi-VN"),
                },
                {
                  label: "Địa chỉ hiện tại",
                  value: selectedEmployee.employee.currentAddress,
                },
                {
                  label: "CCCD",
                  value: selectedEmployee.employee.identityNumber,
                },
                { label: "SĐT", value: selectedEmployee.employee.phoneNumber },
                {
                  label: "Lương cố định",
                  value: new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(selectedEmployee.fixedSalary),
                },
                {
                  label: "Ngày bắt đầu làm việc",
                  value: new Date(
                    selectedEmployee.employee.startDate
                  ).toLocaleDateString("vi-VN"),
                },
                {
                  label: "Thưởng tăng ca",
                  value: new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(selectedEmployee.bonusSalary),
                },
                {
                  label: "Tiền lương hiện tại: ",
                  value: new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(selectedEmployee.finalSalary),
                },
              ].map((item, index) => (
                <div key={index} className="flex">
                  <strong className="w-1/2 text-xl">{item.label}:</strong>
                  <span className="flex-1 text-xl">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-center space-x-2 mt-10">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryHistory;

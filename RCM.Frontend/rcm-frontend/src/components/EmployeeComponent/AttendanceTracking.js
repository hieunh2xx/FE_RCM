import React, { useState, useEffect } from "react";
import { FaSortUp } from "react-icons/fa";
import {
  eachWeekOfInterval,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  parseISO,
  parse,
  isValid,
} from "date-fns";
import { vi } from "date-fns/locale";
import Header from "../../headerComponent/header";
import { useNavigate } from "react-router-dom";

const fetchAttendanceData = async (startDate, endDate, setAttendanceData) => {
  try {
    const response = await fetch(
      `https://localhost:5000/api/Attendance/AttendanceReport/Range?startDate=${startDate}&endDate=${endDate}`
    );
    const data = await response.json();

    const mergedData = {};
    Object.keys(data).forEach((date) => {
      const dayData = data[date];
      const formattedDate = format(parseISO(date), "yyyy-MM-dd");

      // Xử lý attendedRecords
      dayData.attendedRecords.forEach((emp) => {
        if (!mergedData[emp.employeeId]) {
          mergedData[emp.employeeId] = {
            id: emp.employeeId,
            name: emp.fullName,
            birthDate: format(
              parse(emp.birthDate, "yyyy-MM-dd'T'HH:mm:ss", new Date()),
              "yyyy-MM-dd"
            ),
            avatar:
              "https://icons.veryicon.com/png/o/miscellaneous/standard/avatar-15.png",
            status: emp.status,
            attendance: {}, // Đảm bảo tồn tại
          };
        }

        // ✅ Kiểm tra và parse checkInTime
        let checkInTime = emp.checkInTime
          ? parse(emp.checkInTime, "dd/MM/yyyy HH:mm:ss", new Date())
          : null;
        checkInTime = isValid(checkInTime) ? format(checkInTime, "HH:mm") : "-";

        // ✅ Kiểm tra và parse checkOutTime
        let checkOutTime = emp.checkOutTime
          ? parse(emp.checkOutTime, "dd/MM/yyyy HH:mm:ss", new Date())
          : null;
        checkOutTime = isValid(checkOutTime)
          ? format(checkOutTime, "HH:mm")
          : "-";

        // ✅ Đảm bảo attendance tồn tại
        if (!mergedData[emp.employeeId].attendance) {
          mergedData[emp.employeeId].attendance = {};
        }

        mergedData[emp.employeeId].attendance[formattedDate] = {
          checkin: checkInTime,
          checkout: checkOutTime,
        };
      });

      // Xử lý notAttendedRecords
      dayData.notAttendedRecords.forEach((emp) => {
        if (!mergedData[emp.employeeId]) {
          mergedData[emp.employeeId] = {
            id: emp.employeeId,
            name: emp.fullName,
            birthDate: format(
              parse(emp.birthDate, "yyyy-MM-dd'T'HH:mm:ss", new Date()),
              "yyyy-MM-dd"
            ),
            avatar:
              "https://icons.veryicon.com/png/o/miscellaneous/standard/avatar-15.png",
            status: emp.status,
            attendance: {}, // Đảm bảo tồn tại
          };
        }

        // ✅ Kiểm tra nếu không có check-in/check-out, gán "-"
        if (!mergedData[emp.employeeId].attendance[formattedDate]) {
          mergedData[emp.employeeId].attendance[formattedDate] = {
            checkin: "-",
            checkout: "-",
          };
        }
      });
    });
    setAttendanceData(Object.values(mergedData));
  } catch (error) {
    console.error("Error fetching attendance data:", error);
  }
};

const getWeeksInMonth = (year, month) => {
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(new Date(year, month - 1));
  return eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map((date) =>
    format(date, "yyyy-MM-dd")
  );
};

const EmployeeTable = () => {
  const navigate = useNavigate();
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const [employees, setEmployees] = useState([]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [weeks, setWeeks] = useState(
    getWeeksInMonth(currentYear, currentMonth)
  );
  const [selectedWeek, setSelectedWeek] = useState(
    format(currentWeekStart, "yyyy-MM-dd")
  );
  const [weekDates, setWeekDates] = useState([]);

  useEffect(() => {
    const newWeeks = getWeeksInMonth(selectedYear, selectedMonth);
    setWeeks(newWeeks);

    // Nếu không có tuần nào được chọn, chọn tuần đầu tiên
    if (!selectedWeek || !newWeeks.includes(selectedWeek)) {
      setSelectedWeek(newWeeks[0]);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    if (!selectedWeek) return;

    const start = parseISO(selectedWeek);
    const end = endOfWeek(start, { weekStartsOn: 1 });
    const dates = eachDayOfInterval({ start, end }).map((date) =>
      format(date, "yyyy-MM-dd")
    );
    setWeekDates(dates);

    // Lấy dữ liệu cho toàn bộ tuần
    fetchAttendanceData(dates[0], dates[dates.length - 1], setEmployees);
  }, [selectedWeek]);

  const toggleSortOrder = () => {
    setEmployees([...employees].sort((a, b) => a.name.localeCompare(b.name)));
  };

  return (
    <div>
      <Header />
      <div className="h-screen flex flex-col mt-5">
        <div className="flex justify-between items-center p-4 border-b bg-white shadow">
          <div className="text-lg font-bold">Lịch Làm Việc Hàng Tuần</div>
          <div className="flex gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border p-2 rounded"
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
              className="border p-2 rounded"
            >
              {[...Array(12)].map((_, idx) => (
                <option key={idx} value={idx + 1}>
                  {idx + 1}
                </option>
              ))}
            </select>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="border p-2 rounded"
            >
              {weeks.map((week, idx) => (
                <option key={idx} value={week}>{`Tuần ${
                  idx + 1
                } (${week})`}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex-grow overflow-x-auto p-2">
          <table className="w-full border-collapse border">
            <thead>
              <tr>
                <th
                  className="border p-2 bg-gray-100 cursor-pointer flex items-center gap-1"
                  onClick={toggleSortOrder}
                >
                  Nhân Viên {<FaSortUp />}
                </th>
                {weekDates.map((date, index) => (
                  <th
                    key={index}
                    className="border p-2 bg-gray-100 text-center"
                  >
                    {format(parseISO(date), "EEEE (dd/MM)", { locale: vi })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td
                    className="border p-2 text-left"
                    onClick={() => navigate(`/attendance-detail/${emp.id}`)}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={emp.avatar}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <div className="font-bold">{emp.name}</div>
                        <div className="text-sm">{emp.birthDate}</div>
                      </div>
                    </div>
                  </td>
                  {weekDates.map((date, index) => (
                    <td key={index} className="border p-2 text-center">
                      <div>{emp.attendance[date]?.checkin || "-"}</div>
                      <div>{emp.attendance[date]?.checkout || "-"}</div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeTable;

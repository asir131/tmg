import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  UserIcon,
  CreditCardIcon,
  TicketIcon,
  SettingsIcon,
  LogOutIcon,
  EditIcon,
  TrophyIcon,
} from "lucide-react";
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetPointsSummaryQuery,
  useGetPointsHistoryQuery,
  useGetPurchaseHistoryQuery,
} from "../store/api/profileApi";
import { useLogoutUserMutation } from "../store/api/authApi";
import { PhoneNumberInput } from "../components/PhoneNumberInput";
import { validateUKPhoneNumber, normalizePhoneNumber } from "../utils/phoneValidation";

export function Profile() {
  const [activeSection, setActiveSection] = useState("account");
  const location = useLocation();
  const navigate = useNavigate();
  const { data: profile, isLoading, error } = useGetProfileQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: true,
  });
  const {
    data: pointsSummary,
    refetch: refetchPointsSummary,
  } = useGetPointsSummaryQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const [pointsPage, setPointsPage] = useState(1);
  const pointsPerPage = 10;
  const {
    data: pointsHistoryData,
    isLoading: isPointsHistoryLoading,
    refetch: refetchPointsHistory,
  } = useGetPointsHistoryQuery(
    { page: pointsPage, limit: pointsPerPage },
    {
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );
  const [purchasePage, setPurchasePage] = useState(1);
  const purchasePerPage = 10;
  const {
    data: purchaseHistoryData,
    isLoading: isPurchaseHistoryLoading,
    error: purchaseHistoryError,
    refetch: refetchPurchaseHistory,
  } = useGetPurchaseHistoryQuery(
    { page: purchasePage, limit: purchasePerPage },
    {
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("John");
  const [lastName, setLastName] = useState("Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [phone, setPhone] = useState("+44 7700 900000");
  const [address, setAddress] = useState("123 Competition Street, London, UK");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string>('');

  const menuItems = [
    { id: "account", label: "Account Info", icon: UserIcon },
    { id: "points", label: "Points & Rewards", icon: CreditCardIcon },
    { id: "tickets", label: "Purchase History", icon: TicketIcon },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  // Seed form state from profile when it loads
  useEffect(() => {
    const nameParts = (profile?.name ?? "John Doe").split(" ");
    setFirstName(nameParts[0] ?? "John");
    setLastName(nameParts.slice(1).join(" ") || "Doe");
    setEmail(profile?.email ?? "john.doe@example.com");
    setPhone(profile?.phone_number ?? "+44 7700 900000");
    setAddress(profile?.location ?? "123 Competition Street, London, UK");
  }, [profile]);

  const totalEarnedPoints = pointsSummary?.total_earned ?? 0;
  const availablePoints = pointsSummary?.total_points ?? 0;
  const totalSpentPoints = pointsSummary?.total_spent ?? 0;
  const pointsHistory =
    pointsHistoryData?.data?.history ??
    pointsHistoryData?.data?.points_history ??
    [];
  const pointsPagination = pointsHistoryData?.data?.pagination;
  const totalPointsPages = pointsPagination?.totalPages ?? 1;
  const purchaseHistory = purchaseHistoryData?.data?.purchase_history ?? [];
  const purchasePagination = purchaseHistoryData?.data?.pagination;
  const totalPurchasePages = purchasePagination?.total_pages ?? 1;
  const [logoutUser, { isLoading: isLoggingOut }] = useLogoutUserMutation();

  useEffect(() => {
    if (location.pathname.includes("/points")) {
      setActiveSection("points");
    }
  }, [location.pathname]);

  // Force a refresh when switching into points or tickets sections so totals stay live.
  useEffect(() => {
    if (activeSection === "points") {
      refetchPointsSummary();
      refetchPointsHistory();
    }
    if (activeSection === "tickets") {
      refetchPurchaseHistory();
    }
  }, [
    activeSection,
    refetchPointsSummary,
    refetchPointsHistory,
    refetchPurchaseHistory,
  ]);

  const handleEditOrSave = async () => {
    if (!isEditing) {
      setStatusMessage(null);
      setPhoneError('');
      setIsEditing(true);
      return;
    }
    
    setStatusMessage(null);
    setPhoneError('');
    
    // Phone number is optional for updates, but if provided, must be valid
    if (phone && phone.trim()) {
      const normalizedPhone = normalizePhoneNumber(phone);
      if (!validateUKPhoneNumber(normalizedPhone)) {
        setPhoneError('Please enter a valid UK phone number');
        return;
      }
    }
    
    const name = `${firstName} ${lastName}`.trim();
    try {
      await updateProfile({
        name,
        email,
        phone_number: phone && phone.trim() ? normalizePhoneNumber(phone) : null,
        location: address,
      }).unwrap();
      setIsEditing(false);
      setStatusMessage("Profile updated successfully.");
    } catch (err) {
      console.error("Failed to update profile", err);
      setStatusMessage("Failed to update profile.");
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser().unwrap();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      navigate("/login");
    }
  };

  return (
    <div className="py-8">
      <div className="container-premium">
        <motion.div
          initial={{
            opacity: 0,
            y: -20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
          }}
        >
          <h1 className="text-4xl font-bold mb-8">My Profile</h1>
          {isLoading && (
            <p className="text-text-secondary">Loading profile...</p>
          )}
          {error && (
            <p className="text-red-500 text-sm">Failed to load profile.</p>
          )}
          {statusMessage && (
            <p className="text-sm text-text-secondary">{statusMessage}</p>
          )}
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{
              opacity: 0,
              x: -20,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              delay: 0.2,
            }}
            className="lg:col-span-1"
          >
            <div className="card-premium p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-start flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="w-12 h-12 text-accent" />
                </div>
                <h2 className="text-xl font-bold">
                  {profile?.name ?? "John Doe"}
                </h2>
                <p className="text-text-secondary text-sm">{email}</p>
              </div>
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${
                      activeSection === item.id
                        ? "bg-accent text-white"
                      : "hover:bg-gray-800"
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center px-4 py-3 rounded-xl hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogOutIcon className="w-5 h-5 mr-3" />
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </button>
              </nav>
            </div>
          </motion.div>
          {/* Main Content */}
          <motion.div
            initial={{
              opacity: 0,
              x: 20,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              delay: 0.3,
            }}
            className="lg:col-span-3"
          >
            {/* Account Info */}
            {activeSection === "account" && (
              <motion.div
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                className="card-premium p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Account Information</h2>
                  <button
                    className="btn-premium flex items-center"
                    onClick={handleEditOrSave}
                    disabled={isUpdating}
                  >
                    <EditIcon className="w-4 h-4 mr-2" />
                    {isEditing ? (isUpdating ? "Saving..." : "Save") : "Edit"}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      readOnly={!isEditing}
                      className="w-full px-4 py-3 bg-gradient-end rounded-xl border border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      readOnly={!isEditing}
                      className="w-full px-4 py-3 bg-gradient-end rounded-xl border border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      readOnly={!isEditing}
                      className="w-full px-4 py-3 bg-gradient-end rounded-xl border border-gray-700"
                    />
                  </div>
                  <div>
                    {isEditing ? (
                      <PhoneNumberInput
                        value={phone}
                        onChange={(value) => {
                          setPhone(value);
                          setPhoneError('');
                        }}
                        error={phoneError}
                        required={false}
                        disabled={false}
                      />
                    ) : (
                      <>
                        <label className="block text-sm text-text-secondary mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={phone || 'Not provided'}
                          readOnly={true}
                          className="w-full px-4 py-3 bg-gradient-end rounded-xl border border-gray-700"
                        />
                      </>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-text-secondary mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      readOnly={!isEditing}
                      className="w-full px-4 py-3 bg-gradient-end rounded-xl border border-gray-700"
                    />
                  </div>
                </div>
              </motion.div>
            )}
            {/* Points & Rewards */}
            {activeSection === "points" && (
              <motion.div
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                className="space-y-6"
              >
                <div className="card-premium p-6">
                  <h2 className="text-2xl font-bold mb-6">Points & Rewards</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="card-premium p-6 bg-gradient-start">
                      <TrophyIcon className="w-8 h-8 text-accent mb-3" />
                      <div className="text-text-secondary text-sm mb-1">
                        Total Earned Points
                      </div>
                      <div className="text-3xl font-bold">
                        {totalEarnedPoints.toLocaleString()}
                      </div>
                    </div>
                    <div className="card-premium p-6 bg-gradient-start">
                      <CreditCardIcon className="w-8 h-8 text-accent mb-3" />
                      <div className="text-text-secondary text-sm mb-1">
                        Available Points
                      </div>
                      <div className="text-3xl font-bold">
                        {availablePoints.toLocaleString()}
                      </div>
                    </div>
                    <div className="card-premium p-6 bg-gradient-start">
                      <TicketIcon className="w-8 h-8 text-accent mb-3" />
                      <div className="text-text-secondary text-sm mb-1">
                        Total Spent
                      </div>
                      <div className="text-3xl font-bold">
                        {totalSpentPoints.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-4">Points History</h3>
                  <div className="space-y-3">
                    {isPointsHistoryLoading && (
                      <p className="text-text-secondary">
                        Loading points history...
                      </p>
                    )}
                    {!isPointsHistoryLoading && pointsHistory.length === 0 && (
                      <p className="text-text-secondary">No points history.</p>
                    )}
                    {pointsHistory.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between p-4 bg-gradient-end rounded-xl"
                      >
                        <div>
                          <div className="font-medium mb-1">
                            {item.description}
                          </div>
                          <div className="text-sm text-text-secondary">
                            {new Date(item.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div
                          className={`text-lg font-bold ${
                            item.type === "earned"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {item.type === "earned" ? "+" : "-"}
                          {item.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                  {pointsHistory.length > 0 && (
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm text-text-secondary">
                        Page {pointsPage} of {totalPointsPages}
                      </span>
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-2 rounded-lg bg-gradient-end hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          onClick={() =>
                            setPointsPage(Math.max(1, pointsPage - 1))
                          }
                          disabled={pointsPage === 1}
                        >
                          Prev
                        </button>
                        <button
                          className="px-3 py-2 rounded-lg bg-gradient-end hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          onClick={() =>
                            setPointsPage(
                              Math.min(totalPointsPages, pointsPage + 1)
                            )
                          }
                          disabled={pointsPage === totalPointsPages}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            {/* Purchase History */}
            {activeSection === "tickets" && (
              <motion.div
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                className="card-premium p-6"
              >
                <h2 className="text-2xl font-bold mb-6">Purchase History</h2>
                {isPurchaseHistoryLoading && (
                  <p className="text-text-secondary mb-4">
                    Loading purchase history...
                  </p>
                )}
                {purchaseHistoryError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
                    <p className="text-red-400 mb-2">
                      Failed to load purchase history.
                    </p>
                    <p className="text-sm text-text-secondary mb-3">
                      {(purchaseHistoryError as any)?.data?.message || 
                       (purchaseHistoryError as any)?.error ||
                       'The backend API endpoint may not be implemented yet.'}
                    </p>
                    <button
                      onClick={() => refetchPurchaseHistory()}
                      className="text-sm text-accent hover:text-accent/80 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}
                {!isPurchaseHistoryLoading && !purchaseHistoryError && purchaseHistory.length === 0 && (
                  <p className="text-text-secondary mb-4">
                    No purchase history found.
                  </p>
                )}
                {purchaseHistory.length > 0 && (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left py-3 px-4 text-text-secondary font-medium">
                              Competition
                            </th>
                            <th className="text-left py-3 px-4 text-text-secondary font-medium">
                              Tickets
                            </th>
                            <th className="text-left py-3 px-4 text-text-secondary font-medium">
                              Amount
                            </th>
                            <th className="text-left py-3 px-4 text-text-secondary font-medium">
                              Date
                            </th>
                            <th className="text-left py-3 px-4 text-text-secondary font-medium">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchaseHistory.map((purchase) => (
                            <tr
                              key={purchase._id}
                              className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors"
                            >
                              <td className="py-4 px-4 font-medium">
                                {purchase.competition.title}
                              </td>
                              <td className="py-4 px-4">{purchase.tickets}</td>
                              <td className="py-4 px-4">
                                £{purchase.amount.toFixed(2)}
                              </td>
                              <td className="py-4 px-4 text-text-secondary">
                                {new Date(purchase.date).toLocaleDateString()}
                              </td>
                              <td className="py-4 px-4">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    purchase.status === "completed"
                                      ? "bg-green-500/20 text-green-400"
                                      : "bg-yellow-500/20 text-yellow-400"
                                  }`}
                                >
                                  {purchase.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm text-text-secondary">
                        Page {purchasePage} of {totalPurchasePages}
                      </span>
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-2 rounded-lg bg-gradient-end hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          onClick={() =>
                            setPurchasePage(Math.max(1, purchasePage - 1))
                          }
                          disabled={purchasePage === 1}
                        >
                          Prev
                        </button>
                        <button
                          className="px-3 py-2 rounded-lg bg-gradient-end hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          onClick={() =>
                            setPurchasePage(
                              Math.min(totalPurchasePages, purchasePage + 1)
                            )
                          }
                          disabled={purchasePage === totalPurchasePages}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}
            {/* Settings */}
            {activeSection === "settings" && (
              <motion.div
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                className="card-premium p-6"
              >
                <h2 className="text-2xl font-bold mb-6">Settings</h2>
                <div className="space-y-6">
                  <div className="relative">
                    <h3 className="text-lg font-semibold mb-4">
                      Notifications
                    </h3>
                    <div className="space-y-3">
                      {[
                        "Email notifications for new competitions",
                        "SMS alerts for draw results",
                        "Marketing emails and special offers",
                      ].map((item, index) => (
                        <label
                          key={index}
                          className="flex items-center justify-between p-4 bg-gradient-end rounded-xl cursor-pointer hover:bg-gray-800 transition-colors"
                        >
                          <span>{item}</span>
                          <input
                            type="checkbox"
                            defaultChecked={index < 2}
                            className="w-5 h-5 rounded border-gray-700 text-accent focus:ring-accent"
                          />
                        </label>
                      ))}
                    </div>
                    {/* Coming Soon Overlay */}
                    <div className="absolute inset-0 backdrop-blur-sm bg-black/30 rounded-xl flex items-center justify-center">
                      <div className="bg-gradient-start border border-accent/50 px-8 py-4 rounded-xl shadow-lg">
                        <h3 className="text-2xl font-bold text-white">Coming Soon</h3>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

import { useToast } from "@/components/ToastProvider";
import { useChangeUserPassword, useFetchActiveSuppliers, useFetchVendorCashiers, useResetUserLogin } from "@/hooks/useIt";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    FlatList,
    Modal,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  bg: "#F5F8FF",
  surface: "#FFFFFF",
  surfaceAlt: "#EEF4FF",
  border: "#DCE8FF",
  accent: "#2F80ED",
  accentLight: "#D6E8FF",
  accentMid: "#5B9CF6",
  textPrimary: "#0F1F3D",
  textSecondary: "#5A6A85",
  textMuted: "#A0AEC0",
  danger: "#E53E3E",
  dangerLight: "#FFF0F0",
  success: "#2F9E44",
  successLight: "#EBFBEE",
  warn: "#D97706",
  warnLight: "#FFFBEB",
  shadow: "rgba(47,128,237,0.10)",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = "MANAGER" | "CASHIER";

interface Vendor {
  code: string;
  name: string;
  vendor_code:string;
  vendor_name:string;
  id:number;
}

interface VendorUser {
  id: string;
  firstname: string;
  middlename: string;
  lastname: string;
  role: Role;
  username: string;
}

const ROLE_CONFIG: Record<Role, { bg: string; text: string; border: string; label: string }> = {
  MANAGER: { bg: "#EEF4FF", text: "#2F80ED", border: "#BDD4FF", label: "Supervisor" },
  CASHIER: { bg: "#EBFBEE", text: "#2F9E44", border: "#B2EABF", label: "Cashier" },
};


// ─── Vendor Selector Modal ────────────────────────────────────────────────────
interface VendorSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (vendor: Vendor) => void;
  selected: Vendor | null;
  vendorList: Vendor[];
}

const VendorSelectorModal: React.FC<VendorSelectorModalProps> = ({
  visible, onClose, onSelect, selected,vendorList
}) => (
  <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
    <View style={s.overlay}>
      <TouchableOpacity style={s.overlayDismiss} onPress={onClose} activeOpacity={1} />
      <View style={s.sheet}>
        <View style={s.sheetHandle} />
        <Text style={s.sheetTitle}>Select Vendor</Text>
        <FlatList
            //   data={VENDORS}
          data={vendorList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const isActive = selected?.vendor_code === item.vendor_code;
            return (
              <TouchableOpacity
                style={[s.vendorRow, isActive && s.vendorRowActive]}
                onPress={() => { onSelect(item); onClose(); }}
                activeOpacity={0.7}
              >
                <View style={[s.codePill, isActive && s.codePillActive]}>
                  <Text style={[s.codePillText, isActive && s.codePillTextActive]}>
                    {item.vendor_code}
                  </Text>
                </View>
                <Text style={[s.vendorRowName, isActive && { color: C.accent }]}>
                  {item.vendor_name}
                </Text>
                {isActive && <Text style={s.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          }}
        />
        <TouchableOpacity style={s.sheetCancelBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={s.sheetCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// ─── Change Password Modal ────────────────────────────────────────────────────
interface ChangePasswordModalProps {
  visible: boolean;
  user: VendorUser | null;
  onClose: () => void;
  onConfirm: (user: VendorUser, newPassword: string) => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible, user, onClose, onConfirm,
}) => {
  const [newPass, setNewPass] = useState<string>("");
  const [confirmPass, setConfirmPass] = useState<string>("");
  const [showNew, setShowNew] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const reset = () => { setNewPass(""); setConfirmPass(""); setError(""); setShowNew(false); setShowConfirm(false); };

  const handleConfirm = () => {
    if (newPass.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPass !== confirmPass) { setError("Passwords do not match."); return; }
    if (!user) return;
    onConfirm(user, newPass);
    reset();
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={s.overlay}>
        <TouchableOpacity style={s.overlayDismiss} onPress={handleClose} activeOpacity={1} />
        <View style={s.sheet}>
          <View style={s.sheetHandle} />

          {/* Header */}
          <View style={s.modalHeaderRow}>
            <View style={[s.modalIconBox, { backgroundColor: C.accentLight }]}>
              <Text style={s.modalIconText}>🔑</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.modalActionTitle}>Change Password</Text>
              <Text style={s.modalActionSub}>{user?.username ?? ""}</Text>
            </View>
          </View>

          {/* New Password */}
          <Text style={s.fieldLabel}>New Password</Text>
          <View style={s.fieldRow}>
            <TextInput
              style={s.fieldInput}
              placeholder="Min. 8 characters"
              placeholderTextColor={C.textMuted}
              secureTextEntry={!showNew}
              value={newPass}
              onChangeText={setNewPass}
            />
            <TouchableOpacity onPress={() => setShowNew((v) => !v)} style={s.eyeBtn}>
              <Text style={s.eyeIcon}>{showNew ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <Text style={[s.fieldLabel, { marginTop: 14 }]}>Confirm Password</Text>
          <View style={s.fieldRow}>
            <TextInput
              style={s.fieldInput}
              placeholder="Re-enter password"
              placeholderTextColor={C.textMuted}
              secureTextEntry={!showConfirm}
              value={confirmPass}
              onChangeText={setConfirmPass}
            />
            <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} style={s.eyeBtn}>
              <Text style={s.eyeIcon}>{showConfirm ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>

          {!!error && (
            <View style={s.errorBox}>
              <Text style={s.errorBoxText}>{error}</Text>
            </View>
          )}

          <View style={s.modalBtnRow}>
            <TouchableOpacity style={s.btnSecondary} onPress={handleClose} activeOpacity={0.7}>
              <Text style={s.btnSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnPrimary} onPress={handleConfirm} activeOpacity={0.8}>
              <Text style={s.btnPrimaryText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Reset Login Modal ────────────────────────────────────────────────────────
interface ResetLoginModalProps {
  visible: boolean;
  user: VendorUser | null;
  onClose: () => void;
  onConfirm: (user: VendorUser) => void;
}

const ResetLoginModal: React.FC<ResetLoginModalProps> = ({
  visible, user, onClose, onConfirm,
}) => (
  <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
    <View style={s.overlay}>
      <TouchableOpacity style={s.overlayDismiss} onPress={onClose} activeOpacity={1} />
      <View style={s.sheet}>
        <View style={s.sheetHandle} />

        <View style={s.modalHeaderRow}>
          <View style={[s.modalIconBox, { backgroundColor: C.dangerLight }]}>
            <Text style={s.modalIconText}>🔄</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.modalActionTitle}>Reset Login</Text>
            <Text style={s.modalActionSub}>{user?.username ?? ""}</Text>
          </View>
        </View>

        <View style={s.resetWarningBox}>
          <Text style={s.resetWarningText}>
            This will unlock the account for{" "}
            <Text style={{ fontWeight: "700", color: C.textPrimary }}>
              {user?.firstname} {user?.lastname}
            </Text>
            .
          </Text>
        </View>

        <View style={s.modalBtnRow}>
          <TouchableOpacity style={s.btnSecondary} onPress={onClose} activeOpacity={0.7}>
            <Text style={s.btnSecondaryText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.btnPrimary, { backgroundColor: C.danger }]}
            onPress={() => user && onConfirm(user)}
            activeOpacity={0.8}
          >
            <Text style={s.btnPrimaryText}>Reset Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// ─── User Card ────────────────────────────────────────────────────────────────
interface UserCardProps {
  user: VendorUser;
  onChangePassword: (user: VendorUser) => void;
  onResetLogin: (user: VendorUser) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onChangePassword, onResetLogin }) => {
  const role = ROLE_CONFIG[user.role];
  const initials = `${user.firstname[0]}${user.lastname[0]}`;
  const fullName = [user.firstname, user.middlename, user.lastname].filter(Boolean).join(" ");
  return (
    <View style={s.card}>
      {/* Top Row */}
      <View style={s.cardBody}>
        <View style={[s.avatar, { backgroundColor: C.accentLight, borderColor: C.accentMid }]}>
          <Text style={[s.avatarText, { color: C.accent }]}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.cardName}>{fullName}</Text>
          <Text style={s.cardUsername}>@{user.username}</Text>
          <View style={[s.rolePill, { backgroundColor: role.bg, borderColor: role.border }]}>
            <Text style={[s.rolePillText, { color: role.text }]}>{role.label}</Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={s.cardDivider} />

      {/* Actions */}
      <View style={s.cardActions}>
        <TouchableOpacity
          style={s.cardActionBtn}
          onPress={() => onChangePassword(user)}
          activeOpacity={0.7}
        >
          <Text style={s.cardActionIcon}>🔑</Text>
          <Text style={[s.cardActionText, { color: C.accent }]}>Change Password</Text>
        </TouchableOpacity>

        <View style={s.cardActionSep} />

        <TouchableOpacity
          style={s.cardActionBtn}
          onPress={() => onResetLogin(user)}
          activeOpacity={0.7}
        >
          <Text style={s.cardActionIcon}>🔄</Text>
          <Text style={[s.cardActionText, { color: C.danger }]}>Reset Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function VendorUserManagementScreen(): React.ReactElement {
    const { showSuccess, showError, showInfo } = useToast();
    const [vendorModalOpen, setVendorModalOpen] = useState<boolean>(false);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [users, setUsers] = useState<VendorUser[]>([]);
    const [search, setSearch] = useState<string>("");
    const [changePwdUser, setChangePwdUser] = useState<VendorUser | null>(null);
    const [resetUser, setResetUser] = useState<VendorUser | null>(null);

    const listAnim = useRef(new Animated.Value(0)).current;

    const { data:activeVendors } = useFetchActiveSuppliers();
    const { data:vendorUsers } = useFetchVendorCashiers(selectedVendor?.vendor_code ?? '');
    const resetUserLoginMutation = useResetUserLogin()
    const changeUserPasswordMutation = useChangeUserPassword();

    const handleSelectVendor = (vendor: Vendor): void => {
        console.log('select vendor');
        setSelectedVendor(vendor);
        setSearch("");
        listAnim.setValue(0);
        // setUsers(VENDOR_USERS[vendor.code] ?? []);
        setUsers(vendorUsers?.data);
          console.log('vendorUsers',vendorUsers?.data);

        Animated.spring(listAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }).start();
    };

    useEffect(() => {
        if (vendorUsers?.data) {
            setUsers(vendorUsers.data);
        }
    }, [vendorUsers]);

    const handlePasswordConfirm = (user: VendorUser, _newPass: string): void => {
        setChangePwdUser(null);
        Alert.alert("Password Updated", `Password has been changed for ${user.username}.`);

        changeUserPasswordMutation.mutate({
            user_id:user.id,
            password:_newPass
        },{
        onSuccess: (response) => {
            console.log('response',response);
            showSuccess('Change Password success');
            
        },
        onError: (error) => {
            showError('Failed to cancel order on server');
        }
        })
    };

    const handleResetConfirm = async(user: VendorUser) => {
        setResetUser(null);
        try {
            const resetResponse = await resetUserLoginMutation.mutateAsync({
                user_id:Number(user.id)
            });
            if (resetResponse.data.success) {
                setResetUser(null);
                showSuccess(`Login session cleared for ${user.username}.`)
            }
        } catch (error) {
            showError("Reset User failed pls contact system administrator");
        }

    };

    const filteredUsers = users?.filter((u) => {
        const q = search.toLowerCase();
        return (
            u.firstname.toLowerCase().includes(q) ||
            u.lastname.toLowerCase().includes(q) ||
            u.username.toLowerCase().includes(q) ||
            u.role.toLowerCase().includes(q)
        );
    });


    return (
    <SafeAreaView style={s.root}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

        {/* ── Header ── */}
        <View style={s.header}>
        <View>
            <Text style={s.headerEyebrow}>IT Support Portal</Text>
            <Text style={s.headerTitle}>Vendor Users</Text>
        </View>
        <View style={s.headerBadge}>
            <Text style={s.headerBadgeText}>🛡 Admin</Text>
        </View>
        </View>

        {/* ── Vendor Picker ── */}
        <View style={s.section}>
        <Text style={s.sectionLabel}>VENDOR CODE</Text>
        <TouchableOpacity
            style={s.pickerBtn}
            onPress={() => setVendorModalOpen(true)}
            activeOpacity={0.8}
        >
            {selectedVendor ? (
            <View style={{ flex: 1 }}>
                <Text style={s.pickerCode}>{selectedVendor.vendor_code}</Text>
                <Text style={s.pickerName}>{selectedVendor.vendor_name}</Text>
            </View>
            ) : (
            <Text style={s.pickerPlaceholder}>Tap to select a vendor…</Text>
            )}
            <Text style={s.pickerChevron}>›</Text>
        </TouchableOpacity>
        </View>

        {/* ── User List ── */}
        {selectedVendor ? (
        <Animated.View
            style={[
            s.listWrapper,
            {
                opacity: listAnim,
                transform: [{ translateY: listAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            },
            ]}
        >
            {/* Search */}
            <View style={s.searchRow}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput
                style={s.searchInput}
                placeholder="Search by name, username or role…"
                placeholderTextColor={C.textMuted}
                value={search}
                onChangeText={setSearch}
            />
            {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                <Text style={s.searchClear}>✕</Text>
                </TouchableOpacity>
            )}
            </View>

            {/* Count */}
            <Text style={s.listMeta}>
            {filteredUsers?.length} user{filteredUsers?.length !== 1 ? "s" : ""}
            </Text>

            <FlatList<VendorUser>
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
                <UserCard
                user={item}
                onChangePassword={setChangePwdUser}
                onResetLogin={setResetUser}
                />
            )}
            ListEmptyComponent={
                <View style={s.emptyBox}>
                <Text style={s.emptyIcon}>🔎</Text>
                <Text style={s.emptyText}>No users match your search.</Text>
                </View>
            }
            />
        </Animated.View>
        ) : (
        <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>🏢</Text>
            <Text style={s.emptyText}>Select a vendor above{"\n"}to view its users.</Text>
        </View>
        )}

        {/* ── Modals ── */}
        <VendorSelectorModal
        visible={vendorModalOpen}
        onClose={() => setVendorModalOpen(false)}
        onSelect={handleSelectVendor}
        selected={selectedVendor}
        vendorList={activeVendors?.data}
        />
        <ChangePasswordModal
        visible={changePwdUser !== null}
        user={changePwdUser}
        onClose={() => setChangePwdUser(null)}
        onConfirm={handlePasswordConfirm}
        />
        <ResetLoginModal
        visible={resetUser !== null}
        user={resetUser}
        onClose={() => setResetUser(null)}
        onConfirm={handleResetConfirm}
        />
    </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  headerEyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "700",
    color: C.accent,
    textTransform: "uppercase",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: C.textPrimary,
    marginTop: 2,
  },
  headerBadge: {
    backgroundColor: C.accentLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  headerBadgeText: {
    color: C.accent,
    fontSize: 12,
    fontWeight: "700",
  },

  // Section / Picker
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "700",
    color: C.textMuted,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  pickerCode: {
    fontSize: 12,
    fontWeight: "800",
    color: C.accent,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  pickerName: {
    fontSize: 14,
    color: C.textSecondary,
    marginTop: 2,
  },
  pickerPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: C.textMuted,
  },
  pickerChevron: {
    fontSize: 22,
    color: C.textMuted,
    fontWeight: "300",
  },

  // List
  listWrapper: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  listMeta: {
    fontSize: 12,
    color: C.textMuted,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },

  // Search
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 2,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.textPrimary,
    paddingVertical: 0,
  },
  searchClear: {
    fontSize: 13,
    color: C.textMuted,
    paddingHorizontal: 4,
  },

  // Card
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "800",
  },
  cardName: {
    fontSize: 15,
    fontWeight: "700",
    color: C.textPrimary,
  },
  cardUsername: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  rolePill: {
    alignSelf: "flex-start",
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  cardDivider: {
    height: 1,
    backgroundColor: C.border,
  },
  cardActions: {
    flexDirection: "row",
  },
  cardActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  cardActionIcon: { fontSize: 14 },
  cardActionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  cardActionSep: {
    width: 1,
    backgroundColor: C.border,
    marginVertical: 8,
  },

  // Empty
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 60,
    gap: 10,
  },
  emptyIcon: { fontSize: 44 },
  emptyText: {
    fontSize: 15,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },

  // Overlay + Sheet
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,31,61,0.35)",
    justifyContent: "flex-end",
  },
  overlayDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 36 : 28,
    borderTopWidth: 1.5,
    borderColor: C.border,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: C.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 8,
  },

  // Vendor rows
  vendorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  vendorRowActive: {
    backgroundColor: C.accentLight,
  },
  vendorRowName: {
    flex: 1,
    fontSize: 14,
    color: C.textSecondary,
    fontWeight: "500",
  },
  codePill: {
    backgroundColor: C.surfaceAlt,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  codePillActive: {
    backgroundColor: C.accentLight,
    borderColor: C.accentMid,
  },
  codePillText: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textSecondary,
    letterSpacing: 0.8,
  },
  codePillTextActive: {
    color: C.accent,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: "700",
    color: C.accent,
  },
  sheetCancelBtn: {
    marginHorizontal: 20,
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    backgroundColor: C.surfaceAlt,
  },
  sheetCancelText: {
    color: C.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },

  // Modal shared
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 14,
  },
  modalIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalIconText: { fontSize: 22 },
  modalActionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: C.textPrimary,
  },
  modalActionSub: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },

  // Fields
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6,
    marginHorizontal: 20,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    marginHorizontal: 20,
    paddingHorizontal: 14,
  },
  fieldInput: {
    flex: 1,
    fontSize: 14,
    color: C.textPrimary,
    paddingVertical: 13,
  },
  eyeBtn: { paddingLeft: 10 },
  eyeIcon: { fontSize: 16 },

  // Error
  errorBox: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: C.dangerLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorBoxText: {
    fontSize: 13,
    color: C.danger,
    fontWeight: "500",
  },

  // Reset warning
  resetWarningBox: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: C.warnLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  resetWarningText: {
    fontSize: 14,
    color: C.warn,
    lineHeight: 20,
  },

  // Buttons
  modalBtnRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    backgroundColor: C.surfaceAlt,
  },
  btnSecondaryText: {
    color: C.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
  btnPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: C.accent,
    alignItems: "center",
  },
  btnPrimaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
import SwiftUI

@MainActor @Observable
final class StylistSession {
    var stylist: Stylist?
    var services: [StylistService] = []
    var appointments: [Appointment] = []
    var error: String?

    func load(userId: UUID?) async {
        guard let userId else { return }
        do {
            let s = try await StylistRepository().mine(userId: userId)
            stylist = s
            async let sv = StylistRepository().services(stylistId: s.id)
            async let ap = AppointmentRepository().forStylist(s.id)
            (services, appointments) = try await (sv, ap)
        } catch { self.error = error.localizedDescription }
    }
}
@MainActor let stylistSession = StylistSession()

struct StylistAppointmentsView: View {
    @Environment(AuthService.self) private var auth
    private var session: StylistSession { stylistSession }

    var body: some View {
        NavigationStack {
            List {
                let today = session.appointments.filter { Calendar.current.isDateInToday($0.appointmentDate) }
                let upcoming = session.appointments.filter { $0.isUpcoming && !Calendar.current.isDateInToday($0.appointmentDate) }
                Section("Today") {
                    if today.isEmpty { Text("No clients today.").foregroundStyle(Theme.muted) }
                    ForEach(today) { row($0) }
                }
                Section("Upcoming") { ForEach(upcoming) { row($0) } }
            }
            .scrollContentBackground(.hidden).background(Theme.background)
            .navigationTitle("Appointments")
            .refreshable { await session.load(userId: auth.userId) }
            .task { if session.stylist == nil { await session.load(userId: auth.userId) } }
        }
    }

    private func row(_ a: Appointment) -> some View {
        AppointmentRow(appt: a, forStylist: true).listRowBackground(Color.clear)
            .swipeActions {
                Button("Done") { set(a, "completed") }.tint(.green)
                Button("No-show") { set(a, "no_show") }.tint(.orange)
            }
            .contextMenu {
                if let notes = a.stylistInstructions { Text(notes) }
                if let phone = a.customers?.phone, let url = URL(string: "tel:\(phone)") { Link("Call client", destination: url) }
            }
    }
    private func set(_ a: Appointment, _ s: String) {
        Task { try? await AppointmentRepository().setStatus(a.id, s); await session.load(userId: auth.userId) }
    }
}

struct StylistServicesView: View {
    @Environment(AuthService.self) private var auth
    private var session: StylistSession { stylistSession }
    @State private var editing: StylistService?
    @State private var isNew = false

    var body: some View {
        NavigationStack {
            List {
                if session.services.isEmpty {
                    EmptyState(icon: "list.bullet.rectangle", title: "Add your first service", message: "Clients can book once you list a service with a price.")
                        .listRowBackground(Color.clear)
                }
                ForEach(session.services) { s in
                    Button { isNew = false; editing = s } label: {
                        HStack {
                            VStack(alignment: .leading) { Text(s.name); Text("\(s.durationMinutes) min").font(.caption).foregroundStyle(Theme.muted) }
                            Spacer(); Text(s.price, format: .currency(code: "USD"))
                        }.foregroundStyle(Theme.cream)
                    }
                }
                .onDelete { idx in Task {
                    for i in idx { try? await StylistRepository().deleteService(session.services[i].id) }
                    await session.load(userId: auth.userId)
                } }
            }
            .scrollContentBackground(.hidden).background(Theme.background)
            .navigationTitle("Services")
            .toolbar { Button { guard let st = session.stylist else { return }
                isNew = true
                editing = StylistService(id: UUID(), stylistId: st.id, name: "", description: nil, price: 50, durationMinutes: 60)
            } label: { Image(systemName: "plus") } }
            .sheet(item: $editing) { s in ServiceEditor(service: s, isNew: isNew) { await session.load(userId: auth.userId) } }
        }
    }
}

struct ServiceEditor: View {
    @State var service: StylistService
    let isNew: Bool
    let onSave: () async -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Form {
                TextField("Name", text: $service.name)
                TextField("Description", text: Binding(get: { service.description ?? "" }, set: { service.description = $0 }), axis: .vertical)
                TextField("Price", value: $service.price, format: .currency(code: "USD")).keyboardType(.decimalPad)
                Stepper("\(service.durationMinutes) minutes", value: $service.durationMinutes, in: 15...480, step: 15)
                if let error { Text(error).foregroundStyle(Theme.danger) }
            }
            .navigationTitle(isNew ? "New service" : "Edit service")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) { Button("Save") { Task {
                    do { try await StylistRepository().saveService(service, isNew: isNew); await onSave(); dismiss() }
                    catch { self.error = error.localizedDescription }
                } }.disabled(service.name.isEmpty) }
            }
        }
    }
}

struct StylistProfileView: View {
    @Environment(AuthService.self) private var auth
    private var session: StylistSession { stylistSession }
    @State private var draft: Stylist?
    @State private var saved = false

    var body: some View {
        NavigationStack {
            Form {
                if let s = session.stylist {
                    let d = Binding(get: { draft ?? s }, set: { draft = $0 })
                    Section("Public profile") {
                        TextField("Name", text: d.name)
                        TextField("Business", text: Binding(get: { d.wrappedValue.businessName ?? "" }, set: { d.wrappedValue.businessName = $0 }))
                        TextField("Address", text: Binding(get: { d.wrappedValue.address ?? "" }, set: { d.wrappedValue.address = $0 }))
                        TextField("Bio", text: Binding(get: { d.wrappedValue.bio ?? "" }, set: { d.wrappedValue.bio = $0 }), axis: .vertical)
                    }
                    Button("Save") { Task {
                        try? await StylistRepository().updateProfile(d.wrappedValue)
                        await session.load(userId: auth.userId); saved = true
                    } }
                } else { ProgressView() }
                Section { Button("Sign out", role: .destructive) { Task { await auth.signOut() } } }
            }
            .scrollContentBackground(.hidden).background(Theme.background)
            .navigationTitle("Profile")
            .alert("Saved", isPresented: $saved) {}
            .task { if session.stylist == nil { await session.load(userId: auth.userId) } }
        }
    }
}

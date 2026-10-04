import SwiftUI
import PhotosUI

// Shared customer state for all tabs.
@MainActor let customerSession = CustomerSession()

struct CustomerHomeView: View {
    @Environment(AuthService.self) private var auth
    private var session: CustomerSession { customerSession }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    ScreenHeader(title: "Hi, \(session.customer?.name.components(separatedBy: " ").first ?? "there")",
                                 subtitle: "Your next look starts here.")
                    progressCard
                    if let next = session.nextAppointment { AppointmentRow(appt: next, forStylist: false) }
                    else { EmptyState(icon: "calendar", title: "No visits yet", message: "Try a style, then book a stylist who can do it.").card() }
                    if let latest = session.styles.first {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Your latest preview").font(Theme.display(20)).foregroundStyle(Theme.cream)
                            BeforeAfterSlider(before: session.photos.first.flatMap { URL(string: $0.photoUrl) },
                                              after: latest.generatedImageUrl.flatMap(URL.init(string:)))
                            Text(latest.stylePrompt).font(Theme.body(14)).foregroundStyle(Theme.muted)
                        }.card()
                    }
                }.padding(20)
            }
            .background(Theme.background)
            .refreshable { await session.load(userId: auth.userId) }
            .task { if session.customer == nil { await session.load(userId: auth.userId) } }
        }
    }

    private var progressCard: some View {
        let done = HeadAngle.allCases.filter { session.photo(for: $0) != nil }.count
        return VStack(alignment: .leading, spacing: 10) {
            Text("Your photos").font(Theme.display(20)).foregroundStyle(Theme.cream)
            ProgressView(value: Double(done), total: 5).tint(Theme.cream)
            Text(done == 5 ? "All five angles ready for AI previews." : "\(done) of 5 angles added. Add the rest in Me.")
                .font(Theme.body(14)).foregroundStyle(Theme.muted)
        }.card()
    }
}

struct StyleStudioView: View {
    @State private var vm = StyleStudioVM()
    private var session: CustomerSession { customerSession }
    @State private var shownIndex = 0

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    ScreenHeader(title: "Try on a look", subtitle: "Describe a cut and colour. We'll show it on you.")
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack { ForEach(StyleStudioVM.presets, id: \.self) { p in
                            Button(p) { vm.prompt = p }.font(Theme.body(14))
                                .padding(.horizontal, 14).padding(.vertical, 8)
                                .background(vm.prompt == p ? Theme.cream : Theme.card)
                                .foregroundStyle(vm.prompt == p ? Theme.background : Theme.cream)
                                .clipShape(Capsule())
                        } }
                    }
                    TextField("e.g. Chin-length bob, dark brown", text: $vm.prompt, axis: .vertical).modifier(FieldStyle())
                    Picker("Angle", selection: $vm.selectedAngle) {
                        ForEach(HeadAngle.allCases) { Text($0.label).tag($0) }
                    }.pickerStyle(.segmented)

                    Button { Task { await vm.generate(session: session) } } label: {
                        if vm.generating { HStack { ProgressView().tint(Theme.background); Text("Creating your preview…") } }
                        else { Text("Show me this look") }
                    }.buttonStyle(PrimaryButton()).disabled(vm.prompt.isEmpty || vm.generating)

                    if let e = vm.error { Text(e).foregroundStyle(Theme.taupe).font(Theme.body(14)) }

                    if !vm.results.isEmpty {
                        BeforeAfterSlider(before: (session.photo(for: vm.selectedAngle) ?? session.photos.first).flatMap { URL(string: $0.photoUrl) },
                                          after: URL(string: vm.results[min(shownIndex, vm.results.count - 1)]))
                        if vm.results.count > 1 {
                            Picker("Variation", selection: $shownIndex) {
                                ForEach(vm.results.indices, id: \.self) { Text("Option \($0 + 1)").tag($0) }
                            }.pickerStyle(.segmented)
                        }
                        Text("Your stylist sees this preview with your booking if sharing is on in Me.")
                            .font(Theme.body(13)).foregroundStyle(Theme.muted)
                    }

                    if !session.styles.isEmpty {
                        Text("Saved looks").font(Theme.display(20)).foregroundStyle(Theme.cream)
                        LazyVGrid(columns: [.init(), .init(), .init()]) {
                            ForEach(session.styles) { s in
                                RemoteImage(url: s.generatedImageUrl.flatMap(URL.init(string:)))
                                    .aspectRatio(3/4, contentMode: .fit)
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                        }
                    }
                }.padding(20)
            }.background(Theme.background)
        }
    }
}

struct CustomerAppointmentsView: View {
    @Environment(AuthService.self) private var auth
    private var session: CustomerSession { customerSession }
    var body: some View {
        NavigationStack {
            List {
                let upcoming = session.appointments.filter(\.isUpcoming)
                let past = session.appointments.filter { !$0.isUpcoming }
                Section("Upcoming") {
                    if upcoming.isEmpty { Text("Nothing booked yet.").foregroundStyle(Theme.muted) }
                    ForEach(upcoming) { a in
                        AppointmentRow(appt: a, forStylist: false).listRowBackground(Color.clear)
                            .swipeActions { Button("Cancel", role: .destructive) { Task {
                                try? await AppointmentRepository().setStatus(a.id, "cancelled")
                                await session.load(userId: auth.userId)
                            } } }
                    }
                }
                Section("Past") { ForEach(past) { AppointmentRow(appt: $0, forStylist: false).listRowBackground(Color.clear) } }
            }
            .scrollContentBackground(.hidden).background(Theme.background)
            .navigationTitle("Visits")
            .refreshable { await session.load(userId: auth.userId) }
        }
    }
}

struct CustomerProfileView: View {
    @Environment(AuthService.self) private var auth
    private var session: CustomerSession { customerSession }
    @State private var picking: HeadAngle?
    @State private var item: PhotosPickerItem?
    @State private var uploading: HeadAngle?

    var body: some View {
        NavigationStack {
            Form {
                Section("Five angles") {
                    LazyVGrid(columns: Array(repeating: .init(), count: 3)) {
                        ForEach(HeadAngle.allCases) { angle in
                            Button { picking = angle } label: {
                                ZStack {
                                    if let p = session.photo(for: angle) { RemoteImage(url: URL(string: p.photoUrl)) }
                                    else { Theme.card.overlay(Image(systemName: "plus").foregroundStyle(Theme.taupe)) }
                                    if uploading == angle { ProgressView().tint(Theme.cream) }
                                }
                                .aspectRatio(3/4, contentMode: .fit).clipShape(RoundedRectangle(cornerRadius: 12))
                                .overlay(alignment: .bottom) { Text(angle.label).font(Theme.body(11, weight: .semibold)).padding(4) }
                            }.buttonStyle(.plain)
                        }
                    }
                    if let picking { Text(picking.hint).font(Theme.body(13)).foregroundStyle(Theme.muted) }
                }
                if let c = session.customer {
                    Section("About you") {
                        LabeledContent("Name", value: c.name)
                        LabeledContent("Email", value: c.email)
                        Toggle("Share AI looks with my stylist", isOn: Binding(
                            get: { c.shareAiStylesWithStylist ?? false },
                            set: { v in var u = c; u.shareAiStylesWithStylist = v; session.customer = u
                                Task { try? await CustomerRepository().update(u) } }))
                    }
                }
                Section { Button("Sign out", role: .destructive) { Task { await auth.signOut() } } }
            }
            .scrollContentBackground(.hidden).background(Theme.background).navigationTitle("Me")
            .photosPicker(isPresented: Binding(get: { picking != nil }, set: { if !$0 && item == nil { picking = nil } }),
                          selection: $item, matching: .images)
            .onChange(of: item) { _, newItem in Task { await upload(newItem) } }
        }
    }

    private func upload(_ newItem: PhotosPickerItem?) async {
        guard let newItem, let angle = picking, let userId = auth.userId, let c = session.customer,
              let data = try? await newItem.loadTransferable(type: Data.self),
              let jpeg = UIImage(data: data)?.jpegData(compressionQuality: 0.85) else { item = nil; return }
        uploading = angle
        try? await StorageService().savePhoto(jpeg, userId: userId, customerId: c.id, angle: angle)
        await session.load(userId: userId)
        uploading = nil; item = nil; picking = nil
    }
}

struct AppointmentRow: View {
    let appt: Appointment
    let forStylist: Bool
    var body: some View {
        HStack(spacing: 14) {
            VStack {
                Text(appt.appointmentDate, format: .dateTime.day()).font(Theme.display(26))
                Text(appt.appointmentDate, format: .dateTime.month(.abbreviated)).font(Theme.body(12))
            }.frame(width: 50).foregroundStyle(Theme.cream)
            VStack(alignment: .leading, spacing: 4) {
                Text(appt.stylistServices?.name ?? "Appointment").font(Theme.body(16, weight: .semibold)).foregroundStyle(Theme.cream)
                Text(forStylist ? (appt.customers?.name ?? "Customer") : (appt.stylists?.name ?? "Stylist"))
                    .font(Theme.body(14)).foregroundStyle(Theme.muted)
                Text(appt.appointmentDate, format: .dateTime.hour().minute()).font(Theme.body(13)).foregroundStyle(Theme.taupe)
            }
            Spacer()
            VStack(alignment: .trailing) {
                Text(appt.price, format: .currency(code: "USD")).foregroundStyle(Theme.cream)
                Text(appt.paymentStatus == "paid" ? "Paid" : appt.status.capitalized).font(Theme.body(12)).foregroundStyle(Theme.muted)
            }
        }.card()
    }
}

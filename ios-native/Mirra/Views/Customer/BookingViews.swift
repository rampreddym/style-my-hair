import SwiftUI
import StripePaymentSheet

struct DiscoverView: View {
    @State private var stylists: [Stylist] = []
    @State private var query = ""
    @State private var error: String?

    private var filtered: [Stylist] {
        query.isEmpty ? stylists : stylists.filter {
            $0.name.localizedCaseInsensitiveContains(query) ||
            ($0.specialties ?? []).contains { $0.localizedCaseInsensitiveContains(query) }
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(spacing: 14) {
                    if let error { Text(error).foregroundStyle(Theme.taupe) }
                    ForEach(filtered) { s in
                        NavigationLink(value: s) { StylistCard(stylist: s) }.buttonStyle(.plain)
                    }
                    if filtered.isEmpty && error == nil {
                        EmptyState(icon: "scissors", title: "No stylists found", message: "Try a different name or speciality.")
                    }
                }.padding(20)
            }
            .background(Theme.background)
            .navigationTitle("Find a stylist")
            .searchable(text: $query, prompt: "Name or speciality")
            .navigationDestination(for: Stylist.self) { BookingFlowView(stylist: $0) }
            .task { await load() }
            .refreshable { await load() }
        }
    }
    private func load() async {
        do { stylists = try await StylistRepository().all(); error = nil } catch { self.error = error.localizedDescription }
    }
}

struct StylistCard: View {
    let stylist: Stylist
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            RemoteImage(url: stylist.photoUrl.flatMap(URL.init(string:))).frame(height: 180)
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(stylist.name).font(Theme.display(22)).foregroundStyle(Theme.cream)
                    Spacer()
                    if let r = stylist.rating, r > 0 {
                        Label(String(format: "%.1f", r), systemImage: "star.fill").font(Theme.body(14)).foregroundStyle(Theme.cream)
                    }
                }
                if let b = stylist.businessName { Text(b).font(Theme.body(14)).foregroundStyle(Theme.muted) }
                if let sp = stylist.specialties, !sp.isEmpty {
                    Text(sp.prefix(3).joined(separator: " · ")).font(Theme.body(13)).foregroundStyle(Theme.taupe)
                }
            }.padding(16)
        }
        .background(Theme.card).clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
    }
}

@MainActor @Observable
final class BookingVM {
    let stylist: Stylist
    var services: [StylistService] = []
    var service: StylistService?
    var day = Calendar.current.startOfDay(for: .now)
    var slot: Date?
    var taken: [Appointment] = []
    var tip: Double = 0
    var busy = false
    var error: String?
    var paymentSheet: PaymentSheet?
    var appointmentId: UUID?
    var paymentIntentId: String?
    var done = false

    init(stylist: Stylist) { self.stylist = stylist }

    func load() async {
        services = (try? await StylistRepository().services(stylistId: stylist.id)) ?? []
        await loadDay()
    }
    func loadDay() async { taken = (try? await AppointmentRepository().bookedTimes(stylistId: stylist.id, on: day)) ?? [] }

    /// 9:00–18:00 in 30-min steps; a slot is open if the whole service fits without overlapping a booking.
    var slots: [Date] {
        guard let service else { return [] }
        let cal = Calendar.current
        return stride(from: 9 * 60, through: 18 * 60 - service.durationMinutes, by: 30).compactMap { m in
            guard let start = cal.date(byAdding: .minute, value: m, to: day), start > .now else { return nil }
            let end = start.addingTimeInterval(Double(service.durationMinutes) * 60)
            let clash = taken.contains { a in
                let aEnd = a.appointmentDate.addingTimeInterval(Double(a.stylistServices?.durationMinutes ?? 60) * 60)
                return start < aEnd && a.appointmentDate < end
            }
            return clash ? nil : start
        }
    }

    func book(customer: Customer, latestStyle: GeneratedStyle?) async {
        guard let service, let slot else { return }
        busy = true; error = nil; defer { busy = false }
        do {
            let id = try await AppointmentRepository().create(NewAppointment(
                customer_id: customer.id, stylist_id: stylist.id, service_id: service.id,
                appointment_date: slot, price: service.price, tip_amount: tip,
                status: "pending", payment_status: "pending",
                generated_style_id: (customer.shareAiStylesWithStylist ?? false) ? latestStyle?.id : nil))
            appointmentId = id
            let fx = EdgeFunctionService()
            STPAPIClient.shared.publishableKey = try await fx.stripeKey()
            let intent = try await fx.createPaymentIntent(.init(appointmentId: id, amount: service.price, tip: tip,
                                                                serviceName: service.name, stylistName: stylist.name))
            guard let secret = intent.clientSecret else { throw RepoError.server("Couldn't start payment.") }
            paymentIntentId = intent.paymentIntentId ?? secret.components(separatedBy: "_secret").first
            var config = PaymentSheet.Configuration()
            config.merchantDisplayName = "Mirra"
            config.returnURL = "mirra://stripe-redirect"
            config.style = .alwaysDark
            paymentSheet = PaymentSheet(paymentIntentClientSecret: secret, configuration: config)
        } catch { self.error = error.localizedDescription }
    }

    func handle(_ result: PaymentSheetResult) async {
        switch result {
        case .completed:
            if let appointmentId, let paymentIntentId {
                try? await EdgeFunctionService().confirmPayment(appointmentId: appointmentId, paymentIntentId: paymentIntentId)
                await EdgeFunctionService().sendBookingSMS(appointmentId: appointmentId)
            }
            done = true
        case .canceled: error = "Payment cancelled. Your slot is held as pending."
        case .failed(let e): error = e.localizedDescription
        }
    }
}

struct BookingFlowView: View {
    @State private var vm: BookingVM
    @Environment(AuthService.self) private var auth
    init(stylist: Stylist) { _vm = State(initialValue: BookingVM(stylist: stylist)) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                ScreenHeader(title: vm.stylist.name, subtitle: vm.stylist.bio)

                step("1. Choose a service")
                ForEach(vm.services) { s in
                    Button { vm.service = s; vm.slot = nil } label: {
                        HStack {
                            VStack(alignment: .leading) {
                                Text(s.name).font(Theme.body(16, weight: .semibold))
                                Text("\(s.durationMinutes) min").font(Theme.body(13)).foregroundStyle(Theme.muted)
                            }
                            Spacer()
                            Text(s.price, format: .currency(code: "USD"))
                        }
                        .foregroundStyle(Theme.cream).card()
                        .overlay(RoundedRectangle(cornerRadius: 20).stroke(vm.service == s ? Theme.cream : .clear, lineWidth: 2))
                    }.buttonStyle(.plain)
                }

                if vm.service != nil {
                    step("2. Pick a day and time")
                    DatePicker("Day", selection: $vm.day, in: Date.now..., displayedComponents: .date)
                        .datePickerStyle(.graphical).tint(Theme.cream)
                        .onChange(of: vm.day) { _, d in vm.day = Calendar.current.startOfDay(for: d); vm.slot = nil; Task { await vm.loadDay() } }
                    LazyVGrid(columns: Array(repeating: .init(), count: 4)) {
                        ForEach(vm.slots, id: \.self) { t in
                            Button(t.formatted(date: .omitted, time: .shortened)) { vm.slot = t }
                                .font(Theme.body(14)).frame(maxWidth: .infinity, minHeight: 44)
                                .background(vm.slot == t ? Theme.cream : Theme.card)
                                .foregroundStyle(vm.slot == t ? Theme.background : Theme.cream)
                                .clipShape(Capsule())
                        }
                    }
                    if vm.slots.isEmpty { Text("No open times this day.").foregroundStyle(Theme.muted) }
                }

                if let service = vm.service, vm.slot != nil {
                    step("3. Tip and pay")
                    Picker("Tip", selection: $vm.tip) {
                        Text("No tip").tag(0.0)
                        ForEach([0.15, 0.18, 0.2], id: \.self) { p in Text("\(Int(p * 100))%").tag((service.price * p).rounded()) }
                    }.pickerStyle(.segmented)
                    HStack { Text("Total"); Spacer(); Text(service.price + vm.tip, format: .currency(code: "USD")) }
                        .font(Theme.body(17, weight: .semibold)).foregroundStyle(Theme.cream)

                    if let sheet = vm.paymentSheet {
                        PaymentSheet.PaymentButton(paymentSheet: sheet, onCompletion: { r in Task { await vm.handle(r) } }) {
                            Text("Pay now").frame(maxWidth: .infinity, minHeight: 50)
                                .background(Theme.cream).foregroundStyle(Theme.background).clipShape(Capsule())
                        }
                    } else {
                        Button { Task {
                            guard let c = customerSession.customer else { return }
                            await vm.book(customer: c, latestStyle: customerSession.styles.first)
                        } } label: { vm.busy ? AnyView(ProgressView().tint(Theme.background)) : AnyView(Text("Confirm booking")) }
                            .buttonStyle(PrimaryButton()).disabled(vm.busy)
                    }
                }
                if let e = vm.error { Text(e).foregroundStyle(Theme.taupe) }
            }.padding(20)
        }
        .background(Theme.background)
        .task { await vm.load() }
        .alert("You're booked", isPresented: $vm.done) {
            Button("Done") { Task { await customerSession.load(userId: auth.userId) } }
        } message: { Text("Payment received. Your stylist has your look and details.") }
    }

    private func step(_ t: String) -> some View { Text(t).font(Theme.display(20)).foregroundStyle(Theme.cream) }
}

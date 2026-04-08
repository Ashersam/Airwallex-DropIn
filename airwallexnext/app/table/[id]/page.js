"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function TablePage() {
    const params = useParams();
    const [order, setOrder] = useState(null);
    const ref = useRef(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);


    useEffect(() => {
        if (!params?.id) return;

        fetch(`http://192.168.1.23:5000/get-order/${params.id}`)
            .then(res => res.json())
            .then(setOrder);
    }, [params?.id]);

    async function pay() {
        setLoading(true);
        setStatus(null);
        const res = await fetch("http://192.168.1.23:5000/create-payment-intent", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                amount: order.total,
                currency: "SGD"
            })
        });

        const intent = await res.json();

        window.Airwallex.init({ env: "demo" });

        const dropin = window.Airwallex.createElement("dropIn", {
            intent_id: intent.id,
            client_secret: intent.client_secret,
            currency: intent.currency
        });

        ref.current.innerHTML = "";
        dropin.mount(ref.current);

        dropin.on("success", async () => {
            await fetch("http://192.168.1.23:5000/mark-paid", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: order.id })
            }).then(() => {
                window.location.href = `/success?amount=${order.total}&currency=${intent.currency}`;
            });

            dropin.on("error", (err) => {
                console.error(err);
                setStatus("error");
                setLoading(false);
            });
        });
    }

    if (!order) return <div>Loading...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.receipt}>

                <h3 style={styles.center}>TEST</h3>
                <h2 style={styles.center}>TABLE {params.id}</h2>

                <div style={styles.row}>
                    <span>Pax: {order.pax}</span>
                    <span>OP: {order.operator}</span>
                </div>

                <div style={styles.row}>
                    <span>POS Title: Cashier</span>
                    <span>POS: {order.pos}</span>
                </div>

                <div style={styles.row}>
                    <span>Rcpt#: {order.receipt_no}</span>
                    <span>{order.date}</span>
                </div>

                <hr />

                {order.items.map((item, i) => (
                    <div key={i} style={styles.row}>
                        <span>{item.qty} {item.name}</span>
                        <span>SGD {item.qty * item.price}</span>
                    </div>
                ))}

                <hr />

                <div style={styles.row}>
                    <span>SUBTOTAL</span>
                    <span>SGD {order.subtotal}</span>
                </div>

                <div style={styles.row}>
                    <span>BILL DISC</span>
                    <span>(SGD {order.discount})</span>
                </div>

                <div style={styles.row}>
                    <span>{order.tax_percent}% GST</span>
                    <span>SGD {order.tax.toFixed(2)}</span>
                </div>

                <hr />

                <div style={styles.total}>
                    <span>TOTAL</span>
                    <span>SGD {order.total.toFixed(2)}</span>
                </div>

                {order.status === "PAID" ? (
                    <div style={styles.paidBox}>
                        ✅ Bill Paid
                    </div>
                ) : (
                    <button style={styles.payBtn} onClick={pay}>
                        Pay Now
                    </button>
                )}

                <div ref={ref} style={{ marginTop: 20 }} />
            </div>
        </div>
    );
}

const styles = {
    container: {
        background: "#f4f4f4",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
    },
    receipt: {
        background: "#fff",
        padding: 20,
        width: 350,
        borderRadius: 10,
        boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
        fontFamily: "monospace"
    },
    center: {
        textAlign: "center"
    },
    row: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 5
    },
    total: {
        display: "flex",
        justifyContent: "space-between",
        fontWeight: "bold",
        fontSize: 18,
        marginTop: 10
    },
    payBtn: {
        marginTop: 20,
        width: "100%",
        padding: 12,
        background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        cursor: "pointer"
    },
    paidBox: {
        marginTop: 20,
        padding: 14,
        textAlign: "center",
        fontWeight: "bold",
        fontSize: 18,
        borderRadius: 10,
        background: "linear-gradient(90deg, #22c55e, #16a34a)",
        color: "white",
        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
        animation: "fadeIn 0.5s ease"
      }
};
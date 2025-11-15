import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/date-picker";
import { toast } from "sonner";

export function HomestayBookingForm() {
  const { homestayId } = useParams({ from: "/_authenticated/homestay/$homestayId" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    personInCharge: "",
    numberOfGuests: "",
    numberPlates: "",
    dateOfArrival: undefined as Date | undefined,
    dateOfDeparture: undefined as Date | undefined,
    additionalNotes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (field: "dateOfArrival" | "dateOfDeparture", date: Date | undefined) => {
    setFormData((prev) => ({
      ...prev,
      [field]: date,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        homestayId,
        personInCharge: formData.personInCharge,
        numberOfGuests: parseInt(formData.numberOfGuests),
        numberPlates: formData.numberPlates.split(",").map((plate) => plate.trim()),
        dateOfArrival: formData.dateOfArrival?.toISOString(),
        dateOfDeparture: formData.dateOfDeparture?.toISOString(),
        additionalNotes: formData.additionalNotes,
      };

      const res = await fetch('/api/homestay-checkins', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to submit check-in');

      toast.success("Check-in submitted successfully!");
      try {
        await queryClient.invalidateQueries({ queryKey: ['homestay-list-with-latest'] });
      } catch {}
      navigate({ to: '/homestay' });

      // Reset form
      setFormData({
        personInCharge: "",
        numberOfGuests: "",
        numberPlates: "",
        dateOfArrival: undefined,
        dateOfDeparture: undefined,
        additionalNotes: "",
      });
    } catch (error) {
      toast.error("Failed to submit check-in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Check In For Homestay {homestayId}</CardTitle>
          <CardDescription className="text-gray-600">Please fill in your check-in details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="personInCharge">Person In Charge</Label>
              <Input
                id="personInCharge"
                name="personInCharge"
                type="text"
                placeholder="Enter name of person in charge"
                value={formData.personInCharge}
                onChange={handleInputChange}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numberOfGuests">Number of Guests</Label>
              <Input
                id="numberOfGuests"
                name="numberOfGuests"
                type="number"
                placeholder="Enter number of guests"
                value={formData.numberOfGuests}
                onChange={handleInputChange}
                required
                min="1"
                max="20"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Date of Arrival</Label>
              <DatePicker selected={formData.dateOfArrival} onSelect={(date) => handleDateChange("dateOfArrival", date)} placeholder="Select arrival date" />
            </div>

            <div className="space-y-2">
              <Label>Date of Departure</Label>
              <DatePicker selected={formData.dateOfDeparture} onSelect={(date) => handleDateChange("dateOfDeparture", date)} placeholder="Select departure date" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numberPlates">Vehicle Number Plates</Label>
              <Input
                id="numberPlates"
                name="numberPlates"
                type="text"
                placeholder="Enter number plates (comma separated)"
                value={formData.numberPlates}
                onChange={handleInputChange}
                required
                className="w-full"
              />
              <p className="text-sm text-gray-500">Enter multiple number plates separated by commas (e.g., ABC123, XYZ456)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
              <Textarea
                id="additionalNotes"
                name="additionalNotes"
                placeholder="Any special requests or additional information"
                value={formData.additionalNotes}
                onChange={handleInputChange}
                rows={3}
                className="w-full"
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Submitting..." : "Submit Check In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

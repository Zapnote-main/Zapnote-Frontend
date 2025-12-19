import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Card } from '@/src/components/ui/card'
import Background from '@/src/components/ui/background'

export default function ContactSection() {
    return (
        <Background>
            <section className="flex min-h-screen items-center justify-center">
                    <div className="mx-auto max-w-3xl px-6 lg:px-0">
                        <h1 className="text-center text-4xl font-semibold lg:text-5xl">Contact Sales</h1>

                        <Card className="mx-auto mt-6 max-w-lg p-8 shadow-md sm:p-16">
                            <div>
                                <h2 className="text-xl font-semibold">Let&apos;s get you to the right place</h2>
                            </div>

                            <form
                                action=""
                                className="**:[&>label]:block mt-6 space-y-6 *:space-y-3">
                                <div>
                                    <Label htmlFor="name">Full name</Label>
                                    <Input
                                        type="text"
                                        id="name"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="email">Work Email</Label>
                                    <Input
                                        type="email"
                                        id="email"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="country">Country/Region</Label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Country/Region" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">DR Congo</SelectItem>
                                            <SelectItem value="2">United States</SelectItem>
                                            <SelectItem value="3">France</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>


                                <div>
                                    <Label htmlFor="msg">Message</Label>
                                    <Textarea
                                        id="msg"
                                        rows={3}
                                    />
                                </div>

                                <Button>Submit</Button>
                            </form>
                        </Card>
                    </div>
            </section>
        </Background>
    )    
        
}